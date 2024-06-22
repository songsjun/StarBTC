import { successToast } from "@components/base/Toast";
import { errorToast } from "@components/base/Toast/error";
import { EnsureWalletNetwork } from "@components/data/EnsureWalletNetwork/EnsureWalletNetwork";
import { LoadingButton } from "@mui/lab";
import { LoanOrder } from "@services/orders/model/loan-order";
import { useOrderContract } from "@services/orders/order-contract/useOrderContract";
import { FC, useCallback, useState } from "react";

export const BorrowerRegularUnlockConfirmButton: FC<{
  order: LoanOrder;
  unlockTxId: string;
  unlockWTxId: string;
}> = ({ order, unlockWTxId, unlockTxId }) => {
  const [submitting, setSubmitting] = useState(false);
  const { confirmRegularUnlockTransfer, refreshOrder } = useOrderContract(order);

  const handleConfirmBTCReceived = useCallback(async () => {
    setSubmitting(true);

    try {
      if (!await confirmRegularUnlockTransfer(unlockWTxId, unlockTxId)) {
        errorToast("Failed to confirm BTC reception");
      }
      else {
        await refreshOrder();
        successToast("Borrower BTC reception confirmed");
      }
    }
    catch (e) {
      console.error("confirmRegularUnlockTransfer() error:", e);
    }

    setSubmitting(false);
  }, [confirmRegularUnlockTransfer, refreshOrder, unlockTxId, unlockWTxId]);

  return (
    <EnsureWalletNetwork continuesTo="Unlock BTC" fullWidth btcAccountNeeded>
      <LoadingButton
        fullWidth
        size="large"
        variant="contained"
        loading={submitting}
        disabled={!unlockWTxId}
        onClick={handleConfirmBTCReceived}>
        Confirm BTC received
      </LoadingButton>
    </EnsureWalletNetwork>
  )
}