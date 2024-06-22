import { SectionIntroText } from "@components/base/SectionIntroText";
import { ModalButtonStack } from "@components/modals/ModalButtonStack/ModalButtonStack";
import { Button } from "@mui/material";
import { LoanOrder } from "@services/orders/model/loan-order";
import { FC } from "react";
import { MainContentStack } from "../../OrderModal.styles";
import { OrderDetailsTable } from "../../components/OrderDetailsTable/OrderDetailsTable";

export const OrderClosed: FC<{
  order: LoanOrder;
  onClose: () => void;
}> = ({ order, onClose }) => {
  const handleCancel = () => {
    onClose();
  }

  return (
    <>
      <MainContentStack>
        <SectionIntroText>
          This order is closed. {/*  TBD: tell more about the closing reason (success, etc) */}
        </SectionIntroText>
        <OrderDetailsTable order={order} />
      </MainContentStack>

      {/* Buttons */}
      <ModalButtonStack>
        <Button
          fullWidth
          size="large"
          variant="outlined"
          onClick={handleCancel}>
          Close
        </Button>
      </ModalButtonStack>
    </>)
}