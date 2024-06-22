import { useEVMWallet } from "@services/evm/hooks/useEVMWallet";
import { OrderStatusFilter } from "../../subgraph/subgraph";
import { useAllOrders } from "./useAllOrders";

/**
 * Returns active user's orders, all status included.
 */
export const useMyOrders = (start: number, limit: number, filter?: "borrower" | "lender") => {
  const { account } = useEVMWallet();
  const borrowerFilter = !filter || filter === "borrower" ? account : undefined;
  const lenderFilter = !filter || filter === "lender" ? account : undefined;
  const { isLoading, orders, total, fetch } = useAllOrders(start, limit, borrowerFilter, lenderFilter, OrderStatusFilter.ALL);

  return { isLoading, myOrders: orders, total, fetch };
}