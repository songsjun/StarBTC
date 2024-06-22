import { SectionIntroText } from "@components/base/SectionIntroText";
import { errorToast } from "@components/base/Toast/error";
import { EnsureWalletNetwork } from "@components/data/EnsureWalletNetwork/EnsureWalletNetwork";
import { WarningDemoButton } from "@components/data/WarningDemoButton/WarningDemoButton";
import { ModalButtonStack } from "@components/modals/ModalButtonStack/ModalButtonStack";
import { LoadingButton } from "@mui/lab";
import { Button } from "@mui/material";
import { useUserIsOrderBorrower } from "@services/orders/hooks/ownership/useUserIsOrderBorrower";
import { useUserIsOrderLender } from "@services/orders/hooks/ownership/useUserIsOrderLender";
import { useOrderAutoRefresh } from "@services/orders/hooks/useOrderAutoRefresh";
import { LoanOrder } from "@services/orders/model/loan-order";
import { useOrderContract } from "@services/orders/order-contract/useOrderContract";
import { FC, useCallback, useState } from "react";
import { MainContentStack } from "../../OrderModal.styles";
import { OrderDetailsTable } from "../../components/OrderDetailsTable/OrderDetailsTable";

export const LenderBTCProven: FC<{
  order: LoanOrder; onClose: () => void;
}> = ({ order, onClose }) => {
  const [submitting, setSubmitting] = useState(false);
  const userIsBorrower = useUserIsOrderBorrower(order);
  const userIsLender = useUserIsOrderLender(order);
  const { closeOrder, refreshOrder } = useOrderContract(order);

  useOrderAutoRefresh(order);

  const claimTokens = useCallback(async () => {
    setSubmitting(true);
    try {
      await closeOrder();
      await refreshOrder();
    }
    catch (e) {
      console.error("closeOrder() error:", e);
      errorToast("Failed to claim tokens");
    }
    setSubmitting(false);
  }, [closeOrder, refreshOrder]);

  return (
    <>
      <MainContentStack>
        <SectionIntroText>
          {
            userIsBorrower && <>
              Lender has released your BTC. He will soon claim his {order.token.symbol} tokens back.
            </>
          }
          {
            userIsLender && <>
              Borrower's BTC has been released. Please claim your {order.token.symbol} tokens.
            </>
          }
          {
            !userIsLender && !userIsBorrower && <>
              Borrower's BTC has been released. Now waiting for lender to claim his {order.token.symbol} tokens.
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
        {userIsLender &&
          <EnsureWalletNetwork continuesTo="Claim tokens" evmConnectedNeeded fullWidth>
            <WarningDemoButton action="Claim tokens" fullWidth>
              <LoadingButton
                fullWidth
                size="large"
                variant="contained"
                loading={submitting}
                onClick={claimTokens}>
                Claim tokens
              </LoadingButton>
            </WarningDemoButton>
          </EnsureWalletNetwork>
        }
      </ModalButtonStack>
    </>)
}