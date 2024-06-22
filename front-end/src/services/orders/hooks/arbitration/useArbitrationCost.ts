import { LoanOrder } from "@services/orders/model/loan-order";
import { useOrderContract } from "@services/orders/order-contract/useOrderContract";
import { useEffect, useState } from "react";

export const useArbitrationCost = (order: LoanOrder) => {
  const [cost, setCost] = useState<number>(undefined);
  const { getArbitrationCost } = useOrderContract(order);

  useEffect(() => {
    getArbitrationCost().then(setCost);
  }, [getArbitrationCost]);

  return cost;
}