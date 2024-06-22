import { errorToast } from "@components/base/Toast/error";
import { EnsureWalletNetwork } from "@components/data/EnsureWalletNetwork/EnsureWalletNetwork";
import { WalletContext } from "@contexts/WalletContext";
import { LoadingButton } from "@mui/lab";
import { btcToSats, rsSignatureToDer } from "@services/btc/btc";
import { useBitcoinPublicKey } from "@services/btc/hooks/useBitcoinPublicKey";
import { useBitcoinWalletAction } from "@services/btc/hooks/useBitcoinWalletAction";
import { LockScriptTransactionPurpose } from "@services/orders/btc-tx";
import { useOrderLockScriptMethods } from "@services/orders/hooks/useOrderLockScript";
import { LoanOrder } from "@services/orders/model/loan-order";
import { savePaidBTCOrder } from "@services/orders/storage";
import { Transaction } from "bitcoinjs-lib";
import { FC, useCallback, useContext, useMemo, useState } from "react";

export const LenderTimelockUnlockButton: FC<{
  order: LoanOrder;
}> = ({ order }) => {
  const [submitting, setSubmitting] = useState(false);
  const { signScriptData, publishTransaction } = useBitcoinWalletAction();
  const { buildScriptInfo, buildScriptTransaction } = useOrderLockScriptMethods(order);
  const { bitcoinAccount } = useContext(WalletContext);
  const currentPublicKey = useBitcoinPublicKey(); // Bitcoin public key of currently active wallet (lender)
  const isBitcoinSamePublicKey = order.lender.btcPublicKey === currentPublicKey;

  const handleUnlockBTC = useCallback(async () => {
    setSubmitting(true);

    try {
      console.log("Unlocking BTC to lender as the lender timelock is exceeded and the borrower has not completed his part fo the deal.");

      // Build the unlock script and its address
      const scriptInfo = await buildScriptInfo();

      // Generate the raw unlock btc tx in the same way as during the borrowing phase
      const rawBtcTx = await buildScriptTransaction(LockScriptTransactionPurpose.LENDER_TIME_UNLOCK, false, scriptInfo, bitcoinAccount, order.lockTime1, order.lockTime2, null, null, null);

      console.log("Lender public key:", currentPublicKey);

      // Sign the transaction. Only lender's signature is required here (together with the preimage)
      const orderSatsValue = btcToSats(order.collateralAmount).toNumber();
      console.log("Requesting hash for witness, script:", scriptInfo.script, "value:", orderSatsValue, "transaction:", rawBtcTx);
      const hashForWitness = rawBtcTx.hashForWitnessV0(0, Buffer.from(scriptInfo.script, "hex"), orderSatsValue, Transaction.SIGHASH_ALL).toString("hex");
      console.log("Created hash for witness:", hashForWitness);
      const lenderRSSignature = await signScriptData(hashForWitness);
      if (lenderRSSignature) {
        // Produce the final transaction to unlock the BTCs
        const lenderDerSignature = rsSignatureToDer(lenderRSSignature);

        const btcTx = await buildScriptTransaction(LockScriptTransactionPurpose.LENDER_TIME_UNLOCK, true, scriptInfo, bitcoinAccount, order.lockTime1, order.lockTime2, null, lenderDerSignature, order.preImage);

        // Publish tx through the bitcoin wallet
        try {
          const btcTxId = await publishTransaction(btcTx.toHex());
          console.log("btcTxId", btcTxId)

          // Save btc tx to local storage
          savePaidBTCOrder(order, "lender-time-unlock", btcTxId);
        }
        catch (e) {
          console.error("publishTransaction() error:", e);
          errorToast("Failed to publish bitcoin transaction");
        }
      }
    }
    catch (e) {
      console.error("Timelock unlock error:", e);
    }

    setSubmitting(false);
  }, [buildScriptInfo, buildScriptTransaction, bitcoinAccount, order, currentPublicKey, signScriptData, publishTransaction]);

  const unlockButtonTitle = useMemo(() => {
    if (isBitcoinSamePublicKey)
      return "Unlock BTCs";
    else
      return "Wrong BTC wallet";
  }, [isBitcoinSamePublicKey]);

  return (
    <EnsureWalletNetwork continuesTo="Unlock BTC" fullWidth btcAccountNeeded>
      <LoadingButton
        fullWidth
        size="large"
        variant="contained"
        loading={submitting}
        disabled={!isBitcoinSamePublicKey}
        onClick={handleUnlockBTC}>
        {unlockButtonTitle}
      </LoadingButton>
    </EnsureWalletNetwork>
  )
}