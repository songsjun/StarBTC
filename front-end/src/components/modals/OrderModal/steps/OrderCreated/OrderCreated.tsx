import { ResponsiveTableCell } from "@components/base/ResponsiveTable/ResponsiveTableCell";
import { ResponsiveTableRow } from "@components/base/ResponsiveTable/ResponsiveTableRow";
import { SectionIntroText } from "@components/base/SectionIntroText";
import { IconTip } from "@components/base/Tip";
import { EnsureWalletNetwork } from "@components/data/EnsureWalletNetwork/EnsureWalletNetwork";
import { WarningDemoButton } from "@components/data/WarningDemoButton/WarningDemoButton";
import { ModalButtonStack } from "@components/modals/ModalButtonStack/ModalButtonStack";
import { NameField } from "@components/modals/PlaceOrderModal/PlaceOrderModal.styles";
import { TipPicker } from "@components/modals/PlaceOrderModal/components/TipPicker";
import { WalletContext } from "@contexts/WalletContext";
import { LoadingButton } from "@mui/lab";
import { Button, Stack, Table, TableBody } from "@mui/material";
import { useBitcoinWalletAction } from "@services/btc/hooks/useBitcoinWalletAction";
import { useUserIsOrderCreator } from "@services/orders/hooks/ownership/useOrderCreator";
import { useOrderBorrowerPreImage } from "@services/orders/hooks/useOrderBorrowerPreImage";
import { LoanOrder, LoanOrderStatus } from "@services/orders/model/loan-order";
import { useOrderContract } from "@services/orders/order-contract/useOrderContract";
import { useSnackbar } from "notistack";
import { FC, useCallback, useContext, useState } from "react";
import { MainContentStack, OrderTableCellHeading } from "../../OrderModal.styles";
import { CancelOrderButton } from "../../components/CancelOrderButton";
import { OrderDetailsTable } from "../../components/OrderDetailsTable/OrderDetailsTable";

export const OrderCreated: FC<{
  order: LoanOrder;
  onClose: () => void;
}> = ({ order, onClose }) => {
  const { bitcoinAccount } = useContext(WalletContext);
  const [submitting, setSubmitting] = useState(false);
  const { takeOrder, refreshOrder } = useOrderContract(order);
  const { enqueueSnackbar } = useSnackbar();
  const { getPublicKey } = useBitcoinWalletAction();
  const userIsCreator = useUserIsOrderCreator(order);
  const { generatePreImage } = useOrderBorrowerPreImage(order);
  const [tipAmount, setTipAmount] = useState(0);

  const handleTakeOrder = useCallback(async () => {
    setSubmitting(true);

    // Produce the preimage, it will be needed later. This pre image is a secret unlock key used to unlock the BTC after timeouts.
    const { preImage, preImageHash } = (await generatePreImage()) || {};
    if (preImage) {
      // Refresh the order, in case someone just took is before us
      if (await refreshOrder()) {
        if (order.status$.value !== LoanOrderStatus.CREATED) {
          enqueueSnackbar({
            variant: "info",
            message: "Sorry, this order has been taken by someone else just now.",
            autoHideDuration: 3000,
          });
        }
        else {
          const btcPublicKey = await getPublicKey();
          if (btcPublicKey) {
            console.log("Taking order");
            console.log("BTC address:", bitcoinAccount);
            console.log("BTC pub key:", btcPublicKey);
            console.log("preImage:", preImage);
            console.log("preImageHash:", preImageHash);
            if (await takeOrder(order.token, bitcoinAccount, btcPublicKey, preImageHash, tipAmount)) {
              await refreshOrder();
            }
          }
        }
      }
    }

    setSubmitting(false);
  }, [generatePreImage, refreshOrder, order, getPublicKey, takeOrder, bitcoinAccount, enqueueSnackbar, tipAmount]);

  const handleTipValueChanged = useCallback((value: number) => {
    setTipAmount(value);
  }, []);

  return (
    <>
      <MainContentStack>
        {
          /* !activeAccountIsOrderMaker && */
          <SectionIntroText>
            {userIsCreator && <>
              Your lending order is available. Please wait for someone to accept the deal.
            </>}
            {!userIsCreator && <>
              This lending order is available. Lock your BTC to get lender's {order.token.symbol}. Please mind the repay duration and repay on time.
            </>}
          </SectionIntroText>
        }
        <OrderDetailsTable order={order} />

        {/* Tip for manual confirmation */}
        {!userIsCreator &&
          <Table style={{ width: "auto" }}>
            <TableBody>
              <ResponsiveTableRow>
                <ResponsiveTableCell>
                  <OrderTableCellHeading>
                    <NameField>Confirmation tip</NameField>
                    <IconTip content="Optional tip you give to the lender to incentivize him to quickly confirm your BTC transfer. This can help getting your lent tokens faster. If the lender doesn't confirm rapidly, you get this amount back when the order gets closed." />
                  </OrderTableCellHeading>
                </ResponsiveTableCell>
                <ResponsiveTableCell>
                  <Stack direction="row" alignItems="center" gap={2}>
                    <TipPicker availableValues={[0, 1, 2, 5, 10, 20]} defaultValue={tipAmount} token={order.token} onValueSelected={handleTipValueChanged} />
                  </Stack>
                </ResponsiveTableCell>
              </ResponsiveTableRow>
            </TableBody>
          </Table>
        }
      </MainContentStack>

      {/* Buttons */}
      < ModalButtonStack >
        <Button
          fullWidth
          size="large"
          variant="outlined"
          disabled={submitting}
          onClick={onClose}>
          Close
        </Button>

        {
          !userIsCreator &&
          <EnsureWalletNetwork continuesTo="Take order" evmConnectedNeeded btcAccountNeeded fullWidth>
            <WarningDemoButton action="Take order" fullWidth>
              <LoadingButton
                fullWidth
                size="large"
                variant="contained"
                loading={submitting}
                onClick={handleTakeOrder}>
                Take order
              </LoadingButton>
            </WarningDemoButton>
          </EnsureWalletNetwork>
        }
        {
          userIsCreator &&
          <CancelOrderButton order={order} onCancelled={onClose} />
        }
      </ModalButtonStack >
    </>)
}