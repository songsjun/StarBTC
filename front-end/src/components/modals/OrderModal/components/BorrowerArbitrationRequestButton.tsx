import { errorToast } from "@components/base/Toast/error";
import { EnsureWalletNetwork } from "@components/data/EnsureWalletNetwork/EnsureWalletNetwork";
import { LoadingButton } from "@mui/lab";
import { btcToSats, rsSignatureToDer } from "@services/btc/btc";
import { useBitcoinPublicKey } from "@services/btc/hooks/useBitcoinPublicKey";
import { useBitcoinWalletAction } from "@services/btc/hooks/useBitcoinWalletAction";
import { useERC20Balance } from "@services/evm/hooks/useERC20Balance";
import { useERC20Contract } from "@services/evm/hooks/useERC20Contract";
import { useEnoughERC20Allowance } from "@services/evm/hooks/useEnoughERC20Allowance";
import { LockScriptTransactionPurpose } from "@services/orders/btc-tx";
import { useArbitrationCost } from "@services/orders/hooks/arbitration/useArbitrationCost";
import { useOrderLockScriptMethods } from "@services/orders/hooks/useOrderLockScript";
import { LoanOrder, LoanOrderStatus } from "@services/orders/model/loan-order";
import { useOrderContract } from "@services/orders/order-contract/useOrderContract";
import BigNumber from "bignumber.js";
import { Transaction } from "bitcoinjs-lib";
import { FC, useCallback, useMemo, useState } from "react";

export const BorrowerArbitrationRequestButton: FC<{
  order: LoanOrder;
  disabled?: boolean;
}> = ({ order, disabled = false }) => {
  const [submitting, setSubmitting] = useState(false);
  const { signScriptData } = useBitcoinWalletAction();
  const { buildScriptInfo, buildScriptTransaction } = useOrderLockScriptMethods(order);
  const currentPublicKey = useBitcoinPublicKey(); // Bitcoin public key of currently active wallet (lender)
  const { requestArbitration } = useOrderContract(order);
  const arbitrationCost = useArbitrationCost(order);
  const { contractBalance } = useERC20Balance(order.token.symbol); // Human readable balance of active account's tokens
  const { enoughAllowance, refreshAllowance } = useEnoughERC20Allowance(order.token.contractAddress, order.id, arbitrationCost);
  const enoughBalance = contractBalance !== undefined && contractBalance.gte(arbitrationCost);
  const { approve } = useERC20Contract(order.token.contractAddress);
  const isBorrowerBitcoinSamePublicKey = order.borrower.btcPublicKey === currentPublicKey;

  console.log("contractBalance", contractBalance);
  console.log("arbitrationCost", arbitrationCost);

  /**
   * Called by the borrower in case:
   * - he has repaid but the lender did not unlock the transaction.
   * - or if he forgot to borrow in time after locking his BTC.
   * 
   * This calls the arbitration system that will verify the repayment and if it's ok, the arbiter will 
   * unlock the BTC by itself, using arbiter+borrower signatures.
   */
  const requestContractArbitration = useCallback(async () => {
    setSubmitting(true);

    // Build the unlock script and its address
    const scriptInfo = await buildScriptInfo();

    // Generate the raw unlock btc tx in the same way as during the borrowing phase
    const rawBtcTx = await buildScriptTransaction(LockScriptTransactionPurpose.BORROWER_ARBITER_UNLOCK, false, scriptInfo, order.borrower.btcAddress, null, null, null);

    // Sign the second part of the BTC unlock tx using the bitcoin wallet. The arbiter will 
    // add its own signature to publish the BTC transaction.
    const orderSatsValue = btcToSats(order.collateralAmount).toNumber();
    const hashForWitness = rawBtcTx.hashForWitnessV0(0, Buffer.from(scriptInfo.script, "hex"), orderSatsValue, Transaction.SIGHASH_ALL).toString("hex");
    const borrowerSignature = await signScriptData(hashForWitness);

    if (borrowerSignature) {
      // Call contract arbitration, providing the raw BTC transaction reused by the arbiter, and the borrower's signature (part 1/2 of signers).
      try {
        const borrowerDerSignature = rsSignatureToDer(borrowerSignature);
        if (await requestArbitration(rawBtcTx.toHex(), borrowerDerSignature))
          order.status$.next(LoanOrderStatus.ARBITRATION_REQUESTED);
      }
      catch (e) {
        console.error("requestContractArbitration() error:", e);
        errorToast("Failed to request arbitration");
      }
    }

    setSubmitting(false);
  }, [buildScriptInfo, buildScriptTransaction, order, requestArbitration, signScriptData]);

  /**
  * Publish transaction to increase ERC20 token allowance from user wallet
  * for the order contract.
  */
  const handleApproveSpending = useCallback(async () => {
    setSubmitting(true);
    try {
      await approve(order.id, order.token, new BigNumber(arbitrationCost));
      refreshAllowance();
    }
    catch (e) {
      console.warn("Approve error:", e);
    }
    setSubmitting(false);
  }, [order, approve, arbitrationCost, refreshAllowance]);


  const arbitrationButtonTitle = useMemo(() => {
    if (enoughBalance)
      return "Request arbitration";
    else
      return `${arbitrationCost} ${order.token.symbol} needed`;
  }, [enoughBalance, order, arbitrationCost]);

  return (
    <EnsureWalletNetwork continuesTo="Request arbitration" evmConnectedNeeded bitcoinSignDataNeeded fullWidth>
      {
        enoughAllowance && <LoadingButton
          fullWidth
          size="large"
          variant="contained"
          loading={submitting}
          disabled={!isBorrowerBitcoinSamePublicKey || !enoughBalance || disabled}
          onClick={requestContractArbitration}>
          {arbitrationButtonTitle}
        </LoadingButton>
      }
      {
        !enoughAllowance && <LoadingButton
          fullWidth
          size="large"
          variant="contained"
          loading={submitting}
          disabled={!isBorrowerBitcoinSamePublicKey || enoughAllowance === undefined || disabled}
          onClick={handleApproveSpending}
        >
          Approve spending
        </LoadingButton>
      }
    </EnsureWalletNetwork>
  )
}