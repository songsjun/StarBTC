import { EnsureWalletNetwork } from "@components/data/EnsureWalletNetwork/EnsureWalletNetwork";
import { LoadingButton } from "@mui/lab";
import { LoanOrder, LoanOrderStatus } from "@services/orders/model/loan-order";
import { useOrderContract } from "@services/orders/order-contract/useOrderContract";
import { FC, useCallback, useState } from "react";

export const CancelOrderButton: FC<{
  order: LoanOrder;
  onCancelled: () => void;
}> = ({ order, onCancelled }) => {
  const [submitting, setSubmitting] = useState(false);
  const { closeOrder } = useOrderContract(order);

  const handleCancelOrder = useCallback(async () => {
    setSubmitting(true);
    if (await closeOrder()) {
      // Order successfully cancelled, update status in local model
      order.status$.next(LoanOrderStatus.CLOSED);
      onCancelled();
    }
    setSubmitting(false);
  }, [closeOrder, order, onCancelled]);

  return (
    <EnsureWalletNetwork continuesTo="Cancel order" evmConnectedNeeded fullWidth>
      <LoadingButton
        fullWidth
        size="large"
        variant="contained"
        loading={submitting}
        onClick={handleCancelOrder}>
        Cancel order
      </LoadingButton>
    </EnsureWalletNetwork>
  )
}