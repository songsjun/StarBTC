import { BehaviorSubject } from "rxjs";
import { LoanOrder } from "./model/loan-order";

export type BTCOrderTarget = "borrower-borrow" | "lender-unlock" | "lender-time-unlock";

type PaidBTCOrder = {
  orderId: string; // Order ID for which the BTC payment was sent
  target: BTCOrderTarget;
  txHash: string; // BTC tx hash
}

const BTC_ORDERS_STORAGE_KEY = "btc-orders";
export let paidBTCOrders = new BehaviorSubject<PaidBTCOrder[] | undefined>(undefined);

const loadPaidBTCOrders = () => {
  const rawOrders = localStorage.getItem(BTC_ORDERS_STORAGE_KEY);
  paidBTCOrders.next(rawOrders ? JSON.parse(rawOrders) : []);
}

/**
 * Locally remember a paid BTC amount for a taken order, so that we are able to check
 * its status even after reloading the app.
 * 
 * @param target should be borrow the for initial payment from the borrower to the unlock script, and repay when the lender confirms the loan has been returned.
 */
export const savePaidBTCOrder = (order: LoanOrder, target: BTCOrderTarget, txHash: string) => {
  paidBTCOrders.next([
    ...paidBTCOrders.value,
    {
      orderId: order.id.toString(),
      target,
      txHash
    }
  ]);

  localStorage.setItem(BTC_ORDERS_STORAGE_KEY, JSON.stringify(paidBTCOrders.value))
}

export const getPaidBTCOrder = (orderId: string, target: BTCOrderTarget): PaidBTCOrder | undefined => {
  return paidBTCOrders.value.find(o => o.orderId?.toLowerCase() === orderId?.toLowerCase() && o.target === target);
}

loadPaidBTCOrders();