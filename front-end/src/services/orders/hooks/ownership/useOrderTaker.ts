import { WalletContext } from "@contexts/WalletContext";
import { useContext, useMemo } from "react";
import { LoanOrder, LoanOrderType } from "../../model/loan-order";

/**
 * Returns the EVM address of the user who took the order
 */
export const useOrderTaker = (order: LoanOrder): string => {
  return useMemo(() => {
    return order.type === LoanOrderType.BORROW ? order.lender.evmAddress : order.borrower.evmAddress;
  }, [order]);
}

export const useUserIsOrderTaker = (order: LoanOrder): boolean => {
  const { evmAccount } = useContext(WalletContext);
  const taker = useOrderTaker(order);
  return evmAccount === taker;
}