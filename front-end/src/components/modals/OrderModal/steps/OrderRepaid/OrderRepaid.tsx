import { ErrorLabel } from "@components/base/ErrorLabel/ErrorLabel";
import { SectionIntroText } from "@components/base/SectionIntroText";
import { errorToast } from "@components/base/Toast/error";
import { EnsureWalletNetwork } from "@components/data/EnsureWalletNetwork/EnsureWalletNetwork";
import { ModalButtonStack } from "@components/modals/ModalButtonStack/ModalButtonStack";
import { LoadingButton } from "@mui/lab";
import { Button, CircularProgress } from "@mui/material";
import { btcToSats, rsSignatureToDer } from "@services/btc/btc";
import { useBitcoinPublicKey } from "@services/btc/hooks/useBitcoinPublicKey";
import { useBitcoinWalletAction } from "@services/btc/hooks/useBitcoinWalletAction";
import { LockScriptTransactionPurpose } from "@services/orders/btc-tx";
import { useOrderRepayUnlockExpiration } from "@services/orders/hooks/expirations/useOrderRepayUnlockExpiration";
import { useUserIsOrderBorrower } from "@services/orders/hooks/ownership/useUserIsOrderBorrower";
import { useUserIsOrderLender } from "@services/orders/hooks/ownership/useUserIsOrderLender";
import { useLenderTimelock } from "@services/orders/hooks/timelocks/useLenderTimelock";
import { useOrderAutoRefresh } from "@services/orders/hooks/useOrderAutoRefresh";
import { useOrderLockScriptMethods } from "@services/orders/hooks/useOrderLockScript";
import { LoanOrder } from "@services/orders/model/loan-order";
import { savePaidBTCOrder } from "@services/orders/storage";
import { Transaction } from "bitcoinjs-lib";
import { FC, useCallback, useMemo, useState } from "react";
import { MainContentStack } from "../../OrderModal.styles";
import { BorrowerArbitrationRequestButton } from "../../components/BorrowerArbitrationRequestButton";
import { BorrowerRegularUnlockConfirmButton } from "../../components/BorrowerRegularUnlockConfirmButton";
import { LenderTimelockUnlockButton } from "../../components/LenderTimelockUnlockButton";
import { OrderDetailsTable } from "../../components/OrderDetailsTable/OrderDetailsTable";

export const OrderRepaid: FC<{
  order: LoanOrder;
  unlockTxId: string;
  unlockWTxId: string;
  onClose: () => void;
}> = ({ order, unlockTxId, unlockWTxId, onClose }) => {
  const [submitting, setSubmitting] = useState(false);
  const userIsBorrower = useUserIsOrderBorrower(order);
  const userIsLender = useUserIsOrderLender(order);
  const { signScriptData, publishTransaction } = useBitcoinWalletAction();
  const { buildScriptInfo, buildScriptTransaction } = useOrderLockScriptMethods(order);
  const currentPublicKey = useBitcoinPublicKey(); // Bitcoin public key of currently active wallet (lender)
  const isLenderBitcoinSamePublicKey = order.lender.btcPublicKey === currentPublicKey;
  const { exceeded: lenderTimelockExceeded } = useLenderTimelock(order);
  const { isExpired: unlockTimeExpired } = useOrderRepayUnlockExpiration(order);

  // Automatically refresh order from chain to get verification submission status.
  // Once proof is submitted by the automation service, order state will automatically become LENDER_PROOF_SUBMITTED.
  useOrderAutoRefresh(order);

  /**
   * Called by the lender to return borrower's BTCs.
   */
  const unlockLenderBTCs = useCallback(async () => {
    setSubmitting(true);

    // Build the unlock script and its address
    const scriptInfo = await buildScriptInfo();

    // Generate the raw unlock btc tx in the same way as during the borrowing phase
    const rawBtcTx = await buildScriptTransaction(LockScriptTransactionPurpose.BORROWER_LENDER_UNLOCK, false, scriptInfo, order.borrower.btcAddress, null, null, null);

    // Sign the second part of the BTC unlock tx using the bitcoin wallet. We will now have both borrower's and 
    // lender's signatures so the unlock tx can be published to release the BTCs.
    const orderSatsValue = btcToSats(order.collateralAmount).toNumber();
    const hashForWitness = rawBtcTx.hashForWitnessV0(0, Buffer.from(scriptInfo.script, "hex"), orderSatsValue, Transaction.SIGHASH_ALL).toString("hex");
    const lenderSignature = await signScriptData(hashForWitness);

    if (lenderSignature) {
      // Get borrower's unlock signature from the order contract
      const borrowerUnlockSignature = order.repaySignature;

      // Produce the final transaction with all signatures, to unlock the BTCs
      const lenderDerSignature = rsSignatureToDer(lenderSignature);
      const btcTx = await buildScriptTransaction(LockScriptTransactionPurpose.BORROWER_LENDER_UNLOCK, true, scriptInfo, order.borrower.btcAddress, order.lockTime1, order.lockTime2, borrowerUnlockSignature, lenderDerSignature, null);

      // Publish tx through the bitcoin wallet
      try {
        const btcTxId = await publishTransaction(btcTx.toHex());
        console.log("btcTxId", btcTxId)

        // Save btc tx to local storage
        savePaidBTCOrder(order, "lender-unlock", btcTxId);
      }
      catch (e) {
        console.error("publishTransaction() error:", e);
        errorToast("Failed to publish bitcoin transaction");
      }
    }

    setSubmitting(false);
  }, [buildScriptInfo, buildScriptTransaction, order, publishTransaction, signScriptData]);

  const unlockButtonTitle = useMemo(() => {
    if (isLenderBitcoinSamePublicKey)
      return "Unlock BTCs";
    else
      return "Wrong BTC wallet";
  }, [isLenderBitcoinSamePublicKey]);


  return (
    <>
      <MainContentStack>
        <SectionIntroText>
          {
            userIsBorrower &&
            <>You have repaid this loan. Please wait until the lender releases your BTC. <CircularProgress size={12} /></>
          }
          {
            userIsLender &&
            <>Borrower has repaid the loan. Please unlock borrower's BTCs</>
          }
          {
            !userIsBorrower && !userIsLender &&
            <>This loan has been repaid and repayment is being verified. Borrower's BTCs will be unlocked after verification.</>
          }
          {
            lenderTimelockExceeded && <>
              <br />
              <ErrorLabel>Borrower has not completed his part on time. Lender can unlock the BTC for himself.</ErrorLabel>
            </>
          }
        </SectionIntroText>
        <OrderDetailsTable order={order} />
      </MainContentStack>

      {/* Buttons */}
      <ModalButtonStack>
        <Button
          fullWidth
          size="large"
          variant="outlined"
          onClick={onClose}>
          Close
        </Button>
        {
          userIsLender &&
          <EnsureWalletNetwork continuesTo="Unlock BTCs" evmConnectedNeeded bitcoinSignDataNeeded fullWidth>
            <LoadingButton
              fullWidth
              size="large"
              variant="contained"
              loading={submitting}
              disabled={!isLenderBitcoinSamePublicKey}
              onClick={unlockLenderBTCs}>
              {unlockButtonTitle}
            </LoadingButton>
          </EnsureWalletNetwork>
        }
        {userIsBorrower && unlockTimeExpired && <BorrowerArbitrationRequestButton order={order} />}
        {userIsLender && lenderTimelockExceeded && <LenderTimelockUnlockButton order={order} />}
        {userIsBorrower && <BorrowerRegularUnlockConfirmButton order={order} unlockTxId={unlockTxId} unlockWTxId={unlockWTxId} />}
      </ModalButtonStack>
    </>)
}