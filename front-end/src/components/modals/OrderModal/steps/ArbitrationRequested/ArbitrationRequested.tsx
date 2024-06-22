import { SectionIntroText } from "@components/base/SectionIntroText";
import { ModalButtonStack } from "@components/modals/ModalButtonStack/ModalButtonStack";
import { Button } from "@mui/material";
import { LoanOrder } from "@services/orders/model/loan-order";
import { FC } from "react";
import { MainContentStack } from "../../OrderModal.styles";
import { OrderDetailsTable } from "../../components/OrderDetailsTable/OrderDetailsTable";

export const ArbitrationRequested: FC<{
  order: LoanOrder;
  onClose: () => void;
}> = ({ order, onClose }) => {

  return (
    <>
      <MainContentStack>
        <SectionIntroText>
          Arbitration has been requested by the borrower. Arbiters will check the loan status and potentially unlock the BTC transfer.
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
      </ModalButtonStack>
    </>)
}