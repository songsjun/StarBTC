import { SectionIntroText } from "@components/base/SectionIntroText";
import { EnsureWalletNetwork } from "@components/data/EnsureWalletNetwork/EnsureWalletNetwork";
import { ModalButtonStack } from "@components/modals/ModalButtonStack/ModalButtonStack";
import { LoadingButton } from "@mui/lab";
import { Button } from "@mui/material";
import { btcToSats } from "@services/btc/btc";
import { useBitcoinPublicKey } from "@services/btc/hooks/useBitcoinPublicKey";
import { useBitcoinWalletAction } from "@services/btc/hooks/useBitcoinWalletAction";
import { estimateBTCFeeRate } from "@services/mempool-api/mempool-api";
import { useOrderTakenExpiration } from "@services/orders/hooks/expirations/useOrderTakenExpiration";
import { useUserIsOrderCreator } from "@services/orders/hooks/ownership/useOrderCreator";
import { useUserIsOrderBorrower } from "@services/orders/hooks/ownership/useUserIsOrderBorrower";
import { useOrderBorrowerPreImage } from "@services/orders/hooks/useOrderBorrowerPreImage";
import { useOrderLockScriptMethods } from "@services/orders/hooks/useOrderLockScript";
import { LoanOrder } from "@services/orders/model/loan-order";
import { savePaidBTCOrder } from "@services/orders/storage";
import { FC, useCallback, useMemo, useState } from "react";
import { MainContentStack } from "../../OrderModal.styles";
import { CancelOrderButton } from "../../components/CancelOrderButton";
import { OrderDetailsTable } from "../../components/OrderDetailsTable/OrderDetailsTable";

export const OrderTaken: FC<{
  order: LoanOrder;
  onClose: () => void;
}> = ({ order, onClose }) => {
  const [submitting, setSubmitting] = useState(false);
  const { sendBitcoin } = useBitcoinWalletAction();
  const userIsBorrower = useUserIsOrderBorrower(order);
  const userIsCreator = useUserIsOrderCreator(order);
  const { generatePreImage } = useOrderBorrowerPreImage(order);
  const { buildScriptInfo } = useOrderLockScriptMethods(order);
  const currentPublicKey = useBitcoinPublicKey(); // Bitcoin public key of currently active wallet
  const isBitcoinSamePublicKey = order.borrower.btcPublicKey === currentPublicKey;
  const { isExpired: isTakenExpired } = useOrderTakenExpiration(order);

  const handleLockBTC = useCallback(async () => {
    setSubmitting(true);

    try {
      const { preImageHash } = (await generatePreImage()) || {};
      if (preImageHash) {
        const scriptInfo = await buildScriptInfo();
        console.log("Script address generated:", scriptInfo.address);

        // Get BTC amount to pay from the order contract
        console.log(order.collateralAmount)
        console.log("BTC collateral to send to the script address:", order.collateralAmount.toFixed());
        const satsToPay = btcToSats(order.collateralAmount).toNumber(); // collateralAmount unit is BTC

        // Estimate bitcoin gas to be used
        const satsPerVB = (await estimateBTCFeeRate());

        console.log(`Asking bitcoin wallet to send ${satsToPay} sats to the bitcoin unlock script at ${scriptInfo.address}, using ${satsPerVB} sats/vB`);

        let txId = await sendBitcoin(scriptInfo.address, satsToPay, satsPerVB);
        if (txId) {
          console.log("BTC transfer completed with transaction ID:", txId);

          savePaidBTCOrder(order, "borrower-borrow", txId);
          order.toLenderBtcTx.next({ txId });
        }
      }
    } catch (e) {
      console.log(e);
    }

    setSubmitting(false);
  }, [generatePreImage, order, sendBitcoin, buildScriptInfo]);

  const lockButtonTitle = useMemo(() => {
    if (isBitcoinSamePublicKey)
      return "Lock BTC";
    else
      return "Wrong BTC wallet";
  }, [isBitcoinSamePublicKey]);

  return (
    <>
      <MainContentStack>
        <SectionIntroText>
          {
            userIsBorrower &&
            <>
              You are now going to lock some BTC in a special place of the bitcoin chain. Your BTC
              will not be owned by anyone during the loan, and can be unlocked to you or to the lender
              depending on repayment conditions. Once your transfer is verified, you will be able to claim the lent {order.token.symbol}.
            </>
          }
          {
            !userIsBorrower &&
            <>
              This order has been taken. Waiting for the borrower to lock his BTC before he can claim the lent {order.token.symbol} tokens.
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
          disabled={submitting}
          onClick={onClose}>
          Close
        </Button>
        {
          userIsBorrower && <EnsureWalletNetwork continuesTo="Lock BTC" fullWidth btcAccountNeeded>
            <LoadingButton
              fullWidth
              size="large"
              variant="contained"
              loading={submitting}
              disabled={!isBitcoinSamePublicKey}
              onClick={handleLockBTC}>
              {lockButtonTitle}
            </LoadingButton>
          </EnsureWalletNetwork>
        }
        {
          userIsCreator && isTakenExpired && <CancelOrderButton order={order} onCancelled={onClose} />
        }
      </ModalButtonStack>
    </>)
}