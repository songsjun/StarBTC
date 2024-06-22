import BigNumber from "bignumber.js";
import { ContractOrderStatus, LoanOrderType, TaprootTransaction } from "./loan-order";

/**
 * Order data aggregated from the raw list of public fields inside order contracts.
 */
export type OrderData = {
  id: string;
  type: LoanOrderType;
  status: ContractOrderStatus;

  token: string; // ERC20 contract address
  tokenAmount: BigNumber; // contract amount
  limitedDays: number; // Loan duration in days

  borrower: string;
  borrowerBtcAddress: string;
  borrowerPublicKey: string; // bytes

  lender: string;
  lenderPublicKey: string;

  interestRate: BigNumber; // 1e18 encoded
  interestValue: BigNumber; // contract amount

  collateralAmount: BigNumber;

  preImage: string; // secret preImage from the borrower, provided at the time borrow() is called
  preImageHash: string;

  createTime: number;
  takenTime: number;
  borrowerProofTime: number; // time at which the BTC payment from the borrower to the lender was submitted
  borrowerRepaidTime: number; // Block timestamp (seconds) at which the borrower has repaid
  borrowedTime: number;
  lenderManuallyConfirmBTCTime: number; // Lender manually confirms the time of receiving BTC (Block timestamp (seconds))

  repaidExpireTime: BigNumber; // TODO rename to repayToUnlockDuration // Time in seconds given to the lender unlock the BTC after the loan was repaid by the borrower When this time is elapsed, the borrower can request an arbitration
  borrowExpirationTime: BigNumber; // Number of seconds the borrower has to claim lender's tokens after lender manual confirmation
  takenExpireTime: number; // Number of seconds the borrower has after taking an order, to submit the BTC transfer proof for verification
  submitProofExpirationTime: number; // Number of seconds the borrower has after the borrow BTC payment has been made, to claim lender's tokens (USDT))

  toLenderBtcTx: TaprootTransaction;
  toBorrowerBtcTx: TaprootTransaction; // bytes32
  repayBtcRawData: string; // Raw data from the borrower, stored to that the lender can retrieve it and publish the unlock btc tx using the same raw data as what the borrower signed.
  repaySignature: string; // bytes - signature of the borrower after signing the unlock script tx

  borrowerConfirmRewardsTips: BigNumber;
  lenderConfirmRewardsTips: BigNumber;

  lockTime1: number; // Timelock for lender to unlock BTCs - Raw time in encoded format (encoding byte + encoded number of seconds by 512 groups)
  lockTime2: number; // Timelock for borrower to unlock BTCs - Raw time in encoded format (encoding byte + encoded number of seconds by 512 groups)
}