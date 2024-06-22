import { WalletContext } from "@contexts/WalletContext";
import { useContext, useMemo } from "react";
import { LoanOrder, LoanOrderType } from "../../model/loan-order";

/**
 * Returns the EVM address of the user who created the order
 */
export const useOrderCreator = (order: LoanOrder): string => {
  return useMemo(() => {
    return order.type === LoanOrderType.BORROW ? order.borrower.evmAddress : order.lender.evmAddress;
  }, [order]);
}

export const useUserIsOrderCreator = (order: LoanOrder): boolean => {
  const { evmAccount } = useContext(WalletContext);
  const creator = useOrderCreator(order);
  return evmAccount === creator;
}