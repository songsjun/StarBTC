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
import { BorrowerRegularUnlockConfirmButton } from "../../components/BorrowerRegularUnlockConfirmButton";
import { OrderDetailsTable } from "../../components/OrderDetailsTable/OrderDetailsTable";

export const LenderBTCSent: FC<{
  order: LoanOrder;
  unlockTxId: string;
  unlockWTxId: string;
  onClose: () => void;
}> = ({ order, unlockTxId, unlockWTxId, onClose }) => {
  const [submitting, setSubmitting] = useState(false);
  const userIsBorrower = useUserIsOrderBorrower(order);
  const { refreshOrder, submitRegularUnlockTransferProof } = useOrderContract(order);
  const userIsLender = useUserIsOrderLender(order);
  const status = useBehaviorSubject(order.status$);
  const txDetails = usePollTransactionDetails(unlockTxId);
  const txConfirmed = txDetails?.confirmations > 0;

  // Automatically refresh order from chain to get verification submission status.
  // Once proof is submitted by the automation service, order state will automatically become LENDER_PROOF_SUBMITTED.
  useOrderAutoRefresh(order);

  const handleRequestZKPVerification = useCallback(async () => {
    setSubmitting(true);

    try {
      const proofParams = await getFillOrderProofParams(order, "lender-unlock");
      if (!await submitRegularUnlockTransferProof(order, proofParams)) {
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
  }, [order, refreshOrder, submitRegularUnlockTransferProof]);

  const introText = useMemo(() => {
    if (userIsBorrower) {
      if (status === LoanOrderStatus.LENDER_PROOF_SUBMITTED)
        return "BTC payment is being verified, please wait.";
      else // REPAID status
        return `The transaction that unlocks your BTC has been sent by the lender and it is being verified. Your BTC will be returned to you soon.`;
    }
    else {
      if (status === LoanOrderStatus.LENDER_PROOF_SUBMITTED)
        return `BTC payment is being verified, please wait.`;
      else { // REPAID status
        if (txConfirmed) {
          if (userIsLender)
            return "Borrower's BTC unlock transaction has been published. You can wait for automatic ZKP verification 30 minutes after unlocking, or send a manual request now.";
          else
            return "Borrower's BTC unlock transaction has been published. Waiting for ZKP verification.";
        }
        else
          return "Borrower's BTC unlock transaction is awaiting block mining.";
      }
    }
  }, [userIsBorrower, userIsLender, status, txConfirmed]);

  return (
    <>
      <MainContentStack>
        <SectionIntroText>
          {introText}
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
          userIsBorrower &&
          <BorrowerRegularUnlockConfirmButton order={order} unlockTxId={unlockTxId} unlockWTxId={unlockWTxId} />
        }
        {
          userIsLender && status === LoanOrderStatus.REPAID &&
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