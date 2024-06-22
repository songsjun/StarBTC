import { SectionIntroText } from "@components/base/SectionIntroText";
import { successToast } from "@components/base/Toast";
import { errorToast } from "@components/base/Toast/error";
import { EnsureWalletNetwork } from "@components/data/EnsureWalletNetwork/EnsureWalletNetwork";
import { WarningDemoButton } from "@components/data/WarningDemoButton/WarningDemoButton";
import { ModalButtonStack } from "@components/modals/ModalButtonStack/ModalButtonStack";
import { LoadingButton } from "@mui/lab";
import { Button } from "@mui/material";
import { useOrderBorrowExpiration } from "@services/orders/hooks/expirations/useOrderBorrowExpiration";
import { useUserIsOrderBorrower } from "@services/orders/hooks/ownership/useUserIsOrderBorrower";
import { useUserIsOrderLender } from "@services/orders/hooks/ownership/useUserIsOrderLender";
import { useOrderAutoRefresh } from "@services/orders/hooks/useOrderAutoRefresh";
import { useOrderBorrowerPreImage } from "@services/orders/hooks/useOrderBorrowerPreImage";
import { LoanOrder } from "@services/orders/model/loan-order";
import { useOrderContract } from "@services/orders/order-contract/useOrderContract";
import { FC, useCallback, useMemo, useState } from "react";
import { MainContentStack } from "../../OrderModal.styles";
import { BorrowerArbitrationRequestButton } from "../../components/BorrowerArbitrationRequestButton";
import { CancelOrderButton } from "../../components/CancelOrderButton";
import { OrderDetailsTable } from "../../components/OrderDetailsTable/OrderDetailsTable";

export const BorrowerBTCProven: FC<{
  order: LoanOrder;
  onClose: () => void;
}> = ({ order, onClose }) => {
  const [submitting, setSubmitting] = useState(false);
  const userIsBorrower = useUserIsOrderBorrower(order);
  const userIsLender = useUserIsOrderLender(order);
  const { borrow, refreshOrder } = useOrderContract(order);
  const { generatePreImage } = useOrderBorrowerPreImage(order);
  const { isExpired } = useOrderBorrowExpiration(order);

  useOrderAutoRefresh(order);

  /**
   * The borrower claims the lent tokens, now that his BTC deposit has been verified.
   * At the same time it provides its preimage secret so the lender can unlock the BTC after time expiration if needed.
   */
  const claimTokens = useCallback(async () => {
    setSubmitting(true);

    try {
      const { preImage } = (await generatePreImage()) || {};
      if (!preImage) {
        throw new Error("Critical error, failed to generate preImage to claim tokens");
      }
      else {
        if (!await borrow(preImage)) {
          errorToast("Failed to claim tokens");
        }
        else {
          await refreshOrder();
          successToast("Tokens claimed successfully. You can now use them. Don't forget to repay the loan on time.");
        }
      }
    }
    catch (e) {
      console.error("Borrow error:", e);
    }

    setSubmitting(false);
  }, [borrow, generatePreImage, refreshOrder]);

  const introText = useMemo(() => {
    if (userIsBorrower) {
      if (!isExpired)
        return `Your BTC transfer has been verified. You can claim your ${order.token.symbol} tokens.`;
      else
        return `Your BTC transfer has been verified but unfortunately you forgot to borrow on time. You can request an arbitration to resolve this issue.`;
    }
    else {
      return `Borrower's BTC transfer has been verified, waiting for him to claim his ${order.token.symbol} tokens.`;
    }
  }, [isExpired, order, userIsBorrower]);

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
          userIsBorrower && isExpired === false &&
          <EnsureWalletNetwork continuesTo="Claim tokens" evmConnectedNeeded btcAccountNeeded bitcoinSignDataNeeded fullWidth>
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
        {
          /* Borrower did not borrow on time. Lender can close the order. Borrower will have to request arbitration to get his BTC back. */
          userIsLender && isExpired && <CancelOrderButton order={order} onCancelled={onClose} />
        }

        {/* Borrower forgot to claim on time. He can request arbitration to recover. */}
        {userIsBorrower && isExpired && <BorrowerArbitrationRequestButton order={order} />}
      </ModalButtonStack>
    </>)
}