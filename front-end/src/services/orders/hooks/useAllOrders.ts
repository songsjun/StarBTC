import { useActiveEVMChainConfig } from "@services/chains/hooks/useActiveEVMChainConfig";
import { useCallback, useEffect, useState } from "react";
import { OrderStatusFilter, fetchOrders } from "../../subgraph/subgraph";
import { LoanOrder } from "../model/loan-order";
import { useOrderData } from "../order-contract/useOrderData";

export const useAllOrders = (start: number, limit: number, borrower: string | undefined, lender: string | undefined, statusFilter: OrderStatusFilter) => {
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState<number>(undefined);
  const [orders, setOrders] = useState<LoanOrder[] | undefined>(undefined);
  const { fetchOrderData } = useOrderData();
  const chain = useActiveEVMChainConfig(true);

  const fetch = useCallback(() => {
    setIsLoading(true);

    fetchOrders(chain, start, limit, borrower, lender, statusFilter).then(async (result) => {
      if (!result) {
        setOrders(undefined);
        setTotal(undefined);
      }
      else {
        const { orders: rawOrders, total: _total } = result;

        const orders: LoanOrder[] = rawOrders && (await Promise.all(rawOrders.map(async rawOrder => {
          const data = await fetchOrderData(rawOrder.id);
          return LoanOrder.fromOrderData(data, chain);
        }))).filter(o => !!o); // keep only not undefined orders (eg: wrong network)

        console.log("All orders:", orders);

        setOrders(orders);
        setTotal(_total);
      }
      setIsLoading(false);
    });
  }, [chain, start, limit, borrower, lender, statusFilter, fetchOrderData]);

  /**
   * Prepends a newly placed order, after creating a new order in this app, to get a refreshed orders list instantly
   * without waiting for the subgraph to get updated.
   */
  const handlePlacedOrder = useCallback((order: LoanOrder) => {
    setOrders([order, ...(orders || [])]);
  }, [orders]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { isLoading, orders, total, fetch, handlePlacedOrder };
}