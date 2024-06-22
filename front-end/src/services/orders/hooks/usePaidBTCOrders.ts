import { useBehaviorSubject } from "@services/ui-ux/hooks/useBehaviorSubject";
import { useMemo } from "react";
import { BTCOrderTarget, getPaidBTCOrder, paidBTCOrders, paidBTCOrders as paidBTCOrders$ } from "../storage";

export const usePaidBTCOrders = () => {
  return useBehaviorSubject(paidBTCOrders$);
}

export const usePaidBTCOrder = (orderId: string, target: BTCOrderTarget) => {
  const BTCOrders = useBehaviorSubject(paidBTCOrders);
  return useMemo(
    () => getPaidBTCOrder(orderId, target),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orderId, BTCOrders, target] // Keep BTCOrders to refresh this hook when orders change
  );
}