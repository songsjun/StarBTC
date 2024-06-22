import { Modal, ModalProps, Stack } from "@mui/material";
import { LoanOrder } from "@services/orders/model/loan-order";
import { FC } from "react";
import { ModalBaseHeader } from "../..";
import { ModalRootCard } from "../ModalRootCard/ModalRootCard";
import { MainContent } from "./components/MainContent/MainContent";

/**
 * Modal to create a new loan order
 */
export const PlaceOrderModal: FC<Omit<ModalProps, "children"> & {
  onHandleClose: () => void;
  onOrderPlaced: (order: LoanOrder) => void;
}> = (props) => {
  const { open, onHandleClose, onOrderPlaced, ...rest } = props;

  const handleOrderPlaced = (order: LoanOrder) => {
    onOrderPlaced(order);
    onHandleClose();
  }

  return (
    <Modal {...rest} open={open} aria-labelledby="parent-modal-title" aria-describedby="parent-modal-description" onClose={onHandleClose}>
      <ModalRootCard>
        {/* Header */}
        <ModalBaseHeader onClose={() => onHandleClose()} >
          <Stack direction="row" alignItems="center">
            Lend USDT
          </Stack>
        </ModalBaseHeader>

        <MainContent onOrderPlaced={handleOrderPlaced} onCancel={onHandleClose} />
      </ModalRootCard>
    </Modal>
  );
};
