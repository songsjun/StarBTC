import { SectionIntroText } from "@components/base/SectionIntroText";
import { successToast } from "@components/base/Toast";
import { errorToast } from "@components/base/Toast/error";
import { ModalButtonStack } from "@components/modals/ModalButtonStack/ModalButtonStack";
import { LoadingButton } from "@mui/lab";
import { Button } from "@mui/material";
import { usePollTransactionDetails } from "@services/btc/hooks/useTransactionDetails";
import { useUserIsOrderBorrower } from "@services/orders/hooks/ownership/useUserIsOrderBorrower";
import { useUserIsOrderLender } from "@services/orders/hooks/ownership/useUserIsOrderLender";
import { useOrderAutoRefresh } from "@services/orders/hooks/useOrderAutoRefresh";
import { LoanOrder, LoanOrderStatus } from "@services/orders/model/loan-order";
import { useOrderContract } from "@services/orders/order-contract/useOrderContract";
import { getFillOrderProofParams } from "@services/orders/zkp-proofs";
import { useBehaviorSubject } from "@services/ui-ux/hooks/useBehaviorSubject";
import { FC, useCallback, useMemo, useState } from "react";
import { MainContentStack } from "../../OrderModal.styles";
import { OrderDetailsTable } from "../../components/OrderDetailsTable/OrderDetailsTable";

/**
 * Borrower has sent BTC but BTC transfer has not been confirmed yet.
 */
export const BorrowerBTCSent: FC<{
  order: LoanOrder;
  toScriptTxId: string;
  onClose: () => void;
}> = ({ order, toScriptTxId, onClose }) => {
  const [submitting, setSubmitting] = useState(false);
  const userIsBorrower = useUserIsOrderBorrower(order);
  const userIsLender = useUserIsOrderLender(order);
  const { confirmTransferToLender, submitToLenderTransferProof, refreshOrder } = useOrderContract(order);
  const borrowerGivesTip = order.lenderConfirmRewardsTips?.gt(0);
  const status = useBehaviorSubject(order.status$);
  const txDetails = usePollTransactionDetails(toScriptTxId);

  // Automatically refresh order from chain to get verification submission status.
  // Once proof is submitted by the automation service, order state will automatically become BORROWER_PROOF_SUBMITTED.
  useOrderAutoRefresh(order);

  const handleConfirmBTCReceived = useCallback(async () => {
    setSubmitting(true);

    try {
      if (!await confirmTransferToLender(toScriptTxId, toScriptTxId)) {
        errorToast("Failed to confirm BTC reception");
      }
      else {
        await refreshOrder();
        successToast("Lender BTC reception confirmed");
      }
    }
    catch (e) {
      console.error("lenderConfirmBorrowerTransfer() error:", e);
    }

    setSubmitting(false);
  }, [confirmTransferToLender, refreshOrder, toScriptTxId]);

  const handleRequestZKPVerification = useCallback(async () => {
    setSubmitting(true);

    try {
      const proofParams = await getFillOrderProofParams(order, "borrower-borrow");
      if (!await submitToLenderTransferProof(order, proofParams)) {
        errorToast("Failed to submit BTC transfer proof");
      }
      else {
        await refreshOrder();
        successToast("BTC transfer proof has been submitted");
      }
    }
    catch (e) {
      console.error("handleRequestZKPVerification() error:", e);
    }

    setSubmitting(false);
  }, [order, refreshOrder, submitToLenderTransferProof]);

  const introText = useMemo(() => {
    if (userIsBorrower) {
      if (status === LoanOrderStatus.BORROWER_PROOF_SUBMITTED)
        return "Your BTC payment is being verified, please wait.";
      else // TAKEN status
        return `Your BTC payment has been sent. Automatic ZKP verification will happen 30 minutes after your payment, but you can request it manually. You will be able to borrow your ${order.token.symbol} tokens after ZKP verification, or if the lender manually confirms he received the payment.`;
    }
    else if (userIsLender) {
      if (status === LoanOrderStatus.BORROWER_PROOF_SUBMITTED)
        return `Borrower's BTC payment is being verified. He will be able to claim ${order.token.symbol} tokens after that.`;
      else // TAKEN status
        return "Borrower's BTC payment has been sent, please confirm reception, or automatic ZKP verification will happen 30 minutes after the payment.";
    }
    else {
      return "Borrower's BTC transfer is being verified. Once completed, he will be able to withdraw the lent tokens.";
    }
  }, [order, userIsBorrower, userIsLender, status]);

  const tipText = useMemo(() => {
    if (userIsLender && borrowerGivesTip)
      return `You can receive ${order.lenderConfirmRewardsTips.toNumber()} ${order.token.symbol} by manually confirming reception of the BTC payment.`;
  }, [borrowerGivesTip, order, userIsLender]);

  return (
    <>
      <MainContentStack>
        <SectionIntroText>
          {introText}
          {tipText}
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
          userIsLender && status === LoanOrderStatus.TAKEN &&
          <LoadingButton
            fullWidth
            size="large"
            variant="contained"
            loading={submitting}
            disabled={!toScriptTxId}
            onClick={handleConfirmBTCReceived}>
            Confirm BTC received
          </LoadingButton>
        }
        {
          userIsBorrower && status === LoanOrderStatus.TAKEN &&
          <LoadingButton
            fullWidth
            size="large"
            variant="contained"
            loading={submitting}
            disabled={!(txDetails?.confirmations > 0)}
            onClick={handleRequestZKPVerification}>
            Request verification
          </LoadingButton>
        }
      </ModalButtonStack>
    </>)
}