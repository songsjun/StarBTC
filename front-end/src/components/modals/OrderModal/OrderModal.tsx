import DebugIcon from "@assets/debug.svg";
import { Modal, ModalProps, Stack } from "@mui/material";
import { btcToSats } from "@services/btc/btc";
import { useCheckReceivedTransfer } from "@services/btc/hooks/useCheckReceivedTransfer";
import { useDebugDumpContractOrder } from "@services/debug/hooks/useDebugDumpContractOrder";
import { useOrderLockScript } from "@services/orders/hooks/useOrderLockScript";
import { useOrderBorrowerVerificationStatus, useOrderLenderVerificationStatus } from "@services/orders/hooks/useOrderVerificationStatus";
import { usePaidBTCOrder } from "@services/orders/hooks/usePaidBTCOrders";
import { LoanOrder, LoanOrderStatus, LoanOrderType, LoanOrderVerificationStatus } from "@services/orders/model/loan-order";
import { useBehaviorSubject } from "@services/ui-ux/hooks/useBehaviorSubject";
import { showDebugActions } from "@utils/debug";
import { FC } from "react";
import { ModalBaseHeader } from "../..";
import { ModalRootCard } from "../ModalRootCard/ModalRootCard";
import { OrderID } from "./OrderModal.styles";
import { ArbitrationRequested } from "./steps/ArbitrationRequested/ArbitrationRequested";
import { BorrowerBTCProven } from "./steps/BorrowerBTCProven/BorrowerBTCProven";
import { BorrowerBTCSent } from "./steps/BorrowerBTCSent/BorrowerBTCSent";
import { LenderBTCProven } from "./steps/LenderBTCProven/LenderBTCProven";
import { LenderBTCSent } from "./steps/LenderBTCSent/LenderBTCSent";
import { OrderBorrowed } from "./steps/OrderBorrowed/OrderBorrowed";
import { OrderClosed } from "./steps/OrderClosed/OrderClosed";
import { OrderCreated } from "./steps/OrderCreated/OrderCreated";
import { OrderRepaid } from "./steps/OrderRepaid/OrderRepaid";
import { OrderTaken } from "./steps/OrderTaken/OrderTaken";

/**
 * Root modal showing order details and various potential actions based on current status
 */
export const OrderModal: FC<Omit<ModalProps, "children"> & {
  order: LoanOrder;
  onHandleClose: () => void;
}> = (props) => {
  const { order, open, onHandleClose, ...rest } = props;
  const status = useBehaviorSubject(order.status$);
  const paidBorrowBTCOrder = usePaidBTCOrder(order.id, "borrower-borrow"); // btc tx sent by the borrower to the lender
  const lenderUnlockBTCOrder = usePaidBTCOrder(order.id, "lender-unlock"); // btc tx sent by the lender to unlock borrower's btcs after a repayment
  const borrowerVerificationStatus = useOrderBorrowerVerificationStatus(order);
  const lenderVerificationStatus = useOrderLenderVerificationStatus(order);
  const { dumpContractOrder } = useDebugDumpContractOrder(order);
  const scriptInfo = useOrderLockScript(order);
  const { txId: toScriptTxId } = useCheckReceivedTransfer(scriptInfo && scriptInfo.address, order.borrower.btcAddress, btcToSats(order.collateralAmount).toNumber(), order.takenAt$.value) || {}; // Monitor received BTC payments in lock script (before borrowing)
  const { txId: regularUnlockTxId, wTxId: regularUnlockWTxId } = useCheckReceivedTransfer(order.borrower.btcAddress, scriptInfo && scriptInfo.address, null, order.takenAt$.value) || {}; // Monitor received BTC payments after repayment

  const handleDebugClicked = () => {
    dumpContractOrder();
  }

  return (
    <Modal {...rest} open={open} aria-labelledby="parent-modal-title" aria-describedby="parent-modal-description" onClose={onHandleClose}>
      <ModalRootCard>
        <ModalBaseHeader onClose={() => onHandleClose()} >
          <Stack direction="column">
            <Stack direction="row" gap={1}><b>{order.type === LoanOrderType.BORROW ? "Borrowing" : "Lending"}</b> loan order</Stack>
            <Stack direction="row" gap={1}>
              <OrderID>{order.id.toString()}</OrderID>
              {showDebugActions() && <img src={DebugIcon} height={20} onClick={handleDebugClicked} />}
            </Stack>
          </Stack>
        </ModalBaseHeader>

        {
          status === LoanOrderStatus.CREATED &&
          <OrderCreated order={order} onClose={() => onHandleClose()} />
        }
        {
          status === LoanOrderStatus.TAKEN &&
          !paidBorrowBTCOrder && !toScriptTxId &&
          <OrderTaken order={order} onClose={() => onHandleClose()} />
        }
        {
          status === LoanOrderStatus.TAKEN &&
          (paidBorrowBTCOrder || toScriptTxId) &&
          <BorrowerBTCSent toScriptTxId={toScriptTxId} order={order} onClose={() => onHandleClose()} />
        }
        {
          status === LoanOrderStatus.BORROWER_PROOF_SUBMITTED &&
          borrowerVerificationStatus == LoanOrderVerificationStatus.PENDING &&
          <BorrowerBTCSent toScriptTxId={toScriptTxId} order={order} onClose={() => onHandleClose()} />
        }
        {
          ((status === LoanOrderStatus.BORROWER_PROOF_SUBMITTED && borrowerVerificationStatus == LoanOrderVerificationStatus.VERIFIED) ||
            status === LoanOrderStatus.BORROWER_PAYMENT_CONFIRMED) &&
          <BorrowerBTCProven order={order} onClose={() => onHandleClose()} />
        }
        {
          status === LoanOrderStatus.BORROWED &&
          <OrderBorrowed order={order} onClose={() => onHandleClose()} />
        }
        {
          status === LoanOrderStatus.REPAID &&
          !lenderUnlockBTCOrder &&
          <OrderRepaid order={order} unlockTxId={regularUnlockTxId} unlockWTxId={regularUnlockWTxId} onClose={() => onHandleClose()} />
        }
        {
          status === LoanOrderStatus.REPAID &&
          lenderUnlockBTCOrder &&
          <LenderBTCSent order={order} unlockTxId={regularUnlockTxId} unlockWTxId={regularUnlockWTxId} onClose={() => onHandleClose()} />
        }
        {
          status === LoanOrderStatus.LENDER_PROOF_SUBMITTED &&
          lenderVerificationStatus === LoanOrderVerificationStatus.PENDING &&
          <LenderBTCSent order={order} unlockTxId={regularUnlockTxId} unlockWTxId={regularUnlockWTxId} onClose={() => onHandleClose()} />
        }
        {
          status === LoanOrderStatus.LENDER_PROOF_SUBMITTED &&
          lenderVerificationStatus === LoanOrderVerificationStatus.VERIFIED &&
          <LenderBTCProven order={order} onClose={() => onHandleClose()} />
        }
        {
          status === LoanOrderStatus.ARBITRATION_REQUESTED &&
          <ArbitrationRequested order={order} onClose={() => onHandleClose()} />
        }
        {
          status === LoanOrderStatus.CLOSED &&
          <OrderClosed order={order} onClose={() => onHandleClose()} />
        }
      </ModalRootCard>
    </Modal>
  );
};
