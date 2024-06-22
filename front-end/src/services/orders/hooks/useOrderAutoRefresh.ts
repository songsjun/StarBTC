import { useActiveEVMChainConfig } from "@services/chains/hooks/useActiveEVMChainConfig";
import { useInterval } from "react-use";
import { LoanOrder } from "../model/loan-order";
import { useOrderData } from "../order-contract/useOrderData";

/**
 * Automatically refreshes the target order with latest chain information at a given interval.
 * Useful to know if an order has been externally updated, for example, proof submitted or verified.
 */
export const useOrderAutoRefresh = (order: LoanOrder, intervalMs = 10000) => {
  const { fetchOrderData } = useOrderData();
  const activeChain = useActiveEVMChainConfig();

  // Check latest order status every N seconds, to know if it has became verified (BTC payment confirmed)
  useInterval(() => {
    if (order) {
      fetchOrderData(order.id).then(data => order.updateWithOrderData(data, activeChain));
    }
  }, intervalMs);
}