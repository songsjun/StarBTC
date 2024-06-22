import { satsToBtc } from "@services/btc/btc";
import { ChainConfig } from "@services/chains/chain-config";
import { isNullOrEmptyAddress } from "@services/evm/utils";
import { TokenOrNative } from "@services/tokens/token-or-native";
import { getTokenByAddress, tokenToReadableValue } from "@services/tokens/tokens";
import BigNumber from "bignumber.js";
import { BehaviorSubject } from "rxjs";
import { OrderData } from "./order-data";

export enum LoanOrderStatus {
  CREATED, // Initial state
  TAKEN, // A taker has agreed to make the deal (borrower or lender, depending on order type)
  BORROWER_PROOF_SUBMITTED, // The borrower has supposedly locked the BTC and has submitted a proof (not yet verified)
  BORROWER_PAYMENT_CONFIRMED, // Lender has manually confirmed that the lock script has received lender's BTC transfer
  BORROWED, // The borrower BTC lock proof has been verified and tokens have been transfered to the borrower. Now waiting for repayment.
  REPAID, // Borrower has repaid the borrowed tokens. Lender has not confirmed
  LENDER_PROOF_SUBMITTED, // After token repayment, the lender or the proof service have confirmed that the repayment was done (ZKP proof verified)
  LENDER_PAYMENT_CONFIRMED, // Borrower has manually confirmed that the lender has executed the unlock script so that his BTC have been unlocked and received.
  ARBITRATION_REQUESTED, // After a repayment, the borrower has made a call to the arbiter to solve a dispute. Now waiting for the arbiter to submit proofs.
  CLOSED // Final order state, nothing can happen after that
}

export enum LoanOrderVerificationStatus {
  PENDING,
  VERIFIED,
  VERIFICATION_FAILED
}

/**
 * Order status coming from the contract / not provided by typechain so far
 */
export enum ContractOrderStatus {
  CREATED, // Initial state
  TAKEN, // A taker has agreed to make the deal (borrower or lender, depending on order type)
  BORROWER_PROOF_SUBMITTED, // The borrower has supposedly locked the BTC and has submitted a proof (not yet verified)
  BORROWER_PAYMENT_CONFIRMED, // Lender has manually confirmed that the lock script has received lender's BTC transfer
  BORROWED, // The borrower BTC lock proof has been verified and tokens have been transfered to the borrower. Now waiting for repayment.
  REPAID, // Borrower has repaid the borrowed tokens. Lender has not confirmed
  LENDER_PROOF_SUBMITTED, // After token repayment, the lender or the proof service have confirmed that the repayment was done (ZKP proof verified)
  LENDER_PAYMENT_CONFIRMED, // Borrower has manually confirmed that the lender has executed the unlock script so that his BTC have been unlocked and received.
  ARBITRATION_REQUESTED, // After a repayment, the borrower has made a call to the arbiter to solve a dispute. Now waiting for the arbiter to submit proofs.
  CLOSED // Final order state, nothing can happen after that
}

export enum ContractOrderVerificationStatus {
  TO_BE_VERIFIED,
  VERIFIED,
  VERIFY_FAILED
}

export type TaprootTransaction = {
  wTxId?: string;
  txId?: string;
}

export enum LoanOrderType {
  BORROW,
  LENDING
}

/**
 * This class is a wrapper around the raw order model that comes directly from the EVM
 * contract.
 */
export class LoanOrder {
  id: string;
  type: LoanOrderType;
  status$ = new BehaviorSubject<LoanOrderStatus>(undefined);

  borrower: {
    evmAddress: string;
    btcAddress: string;
    btcPublicKey: string;
  };
  lender: {
    evmAddress: string;
    btcPublicKey: string;
  };

  token: TokenOrNative; // eg: USDT, USDC
  tokenAmount: BigNumber; // Amount of tokens initially lent or borrowed, depending on the order type
  interestRate: number; // interest rate, initially computed when creating the order based on the loan expected duration
  interestValue: BigNumber; // Number of tokens that have to be paid as interests (TBD: if max days reached? proportional to current day? proportional to close day?)
  collateralAmount: BigNumber; // Number of BTC
  duration: number; // Loan duration in days
  preImage: string; // secret preImage from the borrower, provided at the time borrow() is called
  preImageHash: string; // sha256() of the preImage

  createdAt: Date;
  takenAt$ = new BehaviorSubject<Date>(undefined);
  borrowerProofSubmittedAt$ = new BehaviorSubject<Date>(undefined);
  borrowedAt$ = new BehaviorSubject<Date>(undefined);
  repaidAt$ = new BehaviorSubject<Date>(undefined);
  lenderManuallyConfirmedBTCAt$ = new BehaviorSubject<Date>(undefined);

  toLenderBtcTx = new BehaviorSubject<TaprootTransaction>(undefined); // BTC tx id of the BTC amount locked by the borrower into the BTC unlock script.
  toBorrowerBtcTx = new BehaviorSubject<TaprootTransaction>(undefined); // BTC tx id of the BTC transfer sent by the lender to unlock borrower's BTC that was locked in the lock script.

  repaySignature: string; // Borrower signature (unlock script tx signed) after repayment
  repayBtcRawData: string; // Raw data from the borrower, stored to that the lender can retrieve it and publish the unlock btc tx using the same raw data as what the borrower signed.

  borrowerConfirmRewardsTips: BigNumber; // Amount given by the lender to the borrower if the borrower quickly confirms transfers
  lenderConfirmRewardsTips: BigNumber; // Amount given by the borrower to the lender if the lender quickly confirms transfers

  repayToUnlockDuration: number; // Time in seconds given to the lender unlock the BTC after the loan was repaid by the borrower When this time is elapsed, the borrower can request an arbitration
  borrowExpirationDuration: number; // Number of seconds the borrower has to claim lender's tokens after lender manual confirmation
  submitProofExpirationDuration: number; // Number of seconds the borrower has after the borrow BTC payment has been submitted to ZKP proof, to claim lender's tokens (USDT))

  lockTime1: number;
  lockTime2: number;

  public static async fromOrderData(orderData: OrderData, chain: ChainConfig): Promise<LoanOrder> {
    const order = new LoanOrder();
    order.updateWithOrderData(orderData, chain);
    return order;
  }

  public updateWithOrderData(orderData: OrderData, chain: ChainConfig) {
    const orderId = orderData.id;
    if (this.id != undefined && this.id !== orderId)
      throw new Error(`Cannot update an order with a different raw order! (different order IDs: ${this.id} vs ${orderId})`);

    this.id = orderId;
    this.type = orderData.type == 0 ? LoanOrderType.BORROW : LoanOrderType.LENDING;
    this.duration = orderData.limitedDays;

    this.createdAt = new Date(orderData.createTime * 1000);
    this.takenAt$.next(orderData.takenTime > 0 ? new Date(orderData.takenTime * 1000) : null);
    this.borrowedAt$.next(orderData.borrowedTime > 0 ? new Date(orderData.borrowedTime * 1000) : null);
    this.borrowerProofSubmittedAt$.next(orderData.borrowerProofTime > 0 ? new Date(orderData.borrowerProofTime * 1000) : null);
    this.repaidAt$.next(orderData.borrowerRepaidTime > 0 ? new Date(orderData.borrowerRepaidTime * 1000) : null);
    this.lenderManuallyConfirmedBTCAt$.next(orderData.lenderManuallyConfirmBTCTime > 0 ? new Date(orderData.lenderManuallyConfirmBTCTime * 1000) : null);

    // TODO MOVE TO HOOK LIKE THE OTHERS this.borrowerBorrowExpiresAt$.next(this.borrowerProofSubmittedAt$.value ? null : moment(this.borrowerProofSubmittedAt$.value).add(orderData.submitProofExpireTime, "seconds").toDate());

    const rawOrderStatus: ContractOrderStatus = orderData.status;

    if (!this.borrower) this.borrower = {} as any;
    this.borrower.evmAddress = orderData.borrower;
    this.borrower.btcAddress = orderData.borrowerBtcAddress;
    this.borrower.btcPublicKey = orderData.borrowerPublicKey;

    if (!this.lender) this.lender = {} as any;
    this.lender.evmAddress = !isNullOrEmptyAddress(orderData.lender) ? orderData.lender : null;
    this.lender.btcPublicKey = orderData.lenderPublicKey;

    this.token = getTokenByAddress(chain, orderData.token);
    this.tokenAmount = tokenToReadableValue(orderData.tokenAmount, this.token.decimals);
    this.interestRate = tokenToReadableValue(orderData.interestRate, 18).toNumber(); // fixed 1e18 encoding
    this.interestValue = tokenToReadableValue(orderData.interestValue, this.token.decimals);
    this.collateralAmount = satsToBtc(orderData.collateralAmount); // sats value converted to BTC

    // Transactions
    this.toLenderBtcTx.next(orderData.toLenderBtcTx);
    this.toBorrowerBtcTx.next(orderData.toBorrowerBtcTx);

    this.preImage = orderData.preImage;
    this.preImageHash = orderData.preImageHash;
    this.repaySignature = orderData.repaySignature;
    this.repayBtcRawData = orderData.repayBtcRawData;

    this.borrowerConfirmRewardsTips = tokenToReadableValue(orderData.borrowerConfirmRewardsTips, this.token.decimals);
    this.lenderConfirmRewardsTips = tokenToReadableValue(orderData.lenderConfirmRewardsTips, this.token.decimals);

    this.lockTime1 = orderData.lockTime1;
    this.lockTime2 = orderData.lockTime2;

    this.repayToUnlockDuration = orderData.repaidExpireTime?.toNumber();
    this.borrowExpirationDuration = orderData.borrowExpirationTime?.toNumber();
    this.submitProofExpirationDuration = orderData.submitProofExpirationTime;

    this.status$.next(LoanOrder.contractStatusToLocalStatus(this.id.toString(), rawOrderStatus));
  }

  public static contractVerificationStatusToLocalStatus(contractStatus: ContractOrderVerificationStatus): LoanOrderVerificationStatus {
    switch (contractStatus) {
      case ContractOrderVerificationStatus.TO_BE_VERIFIED:
        return LoanOrderVerificationStatus.PENDING;
      case ContractOrderVerificationStatus.VERIFIED:
        return LoanOrderVerificationStatus.VERIFIED;
      case ContractOrderVerificationStatus.VERIFY_FAILED:
        return LoanOrderVerificationStatus.VERIFICATION_FAILED;
    }
  }

  public static contractStatusToLocalStatus(orderId: string, contractStatus: ContractOrderStatus): LoanOrderStatus {
    // const paidBTCOrder = getPaidBTCOrder(orderId);

    // Almost 1-1 mapping but we keep contract and local statuses separated as historically the
    // contract statuses were not very clear.
    switch (contractStatus) {
      case ContractOrderStatus.CREATED: return LoanOrderStatus.CREATED;
      case ContractOrderStatus.TAKEN: return LoanOrderStatus.TAKEN;
      case ContractOrderStatus.BORROWED: return LoanOrderStatus.BORROWED;
      case ContractOrderStatus.BORROWER_PROOF_SUBMITTED: return LoanOrderStatus.BORROWER_PROOF_SUBMITTED;
      case ContractOrderStatus.REPAID: return LoanOrderStatus.REPAID;
      case ContractOrderStatus.LENDER_PROOF_SUBMITTED: return LoanOrderStatus.LENDER_PROOF_SUBMITTED;
      case ContractOrderStatus.BORROWER_PAYMENT_CONFIRMED: return LoanOrderStatus.BORROWER_PAYMENT_CONFIRMED;
      case ContractOrderStatus.LENDER_PAYMENT_CONFIRMED: return LoanOrderStatus.LENDER_PAYMENT_CONFIRMED;
      case ContractOrderStatus.ARBITRATION_REQUESTED: return LoanOrderStatus.ARBITRATION_REQUESTED;
      case ContractOrderStatus.CLOSED: return LoanOrderStatus.CLOSED;
      default:
        throw new Error(`"Unhandled contract status! ${contractStatus}`);
    }
  }
}