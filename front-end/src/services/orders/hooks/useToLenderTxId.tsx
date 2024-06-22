import { isNullBitcoinTxId } from "@services/btc/btc";
import { usePollTransactionDetails } from "@services/btc/hooks/useTransactionDetails";
import { useBehaviorSubject } from "@services/ui-ux/hooks/useBehaviorSubject";
import { LoanOrder } from "../model/loan-order";
import { usePaidBTCOrder } from "./usePaidBTCOrders";

/**
 * Returns the regualr "to lender" transfer btc tx id.
 * This tx id is either found in the order itself if already saved,
 * or in local storage if payment has just been sent.
 */
export const useToLenderBtcTx = (order: LoanOrder) => {
  const paidBTCOrder = usePaidBTCOrder(order.id, "borrower-borrow");
  const orderTx = useBehaviorSubject(order.toLenderBtcTx);
  const txId = !isNullBitcoinTxId(orderTx?.txId) ? orderTx.txId : paidBTCOrder?.txHash;
  const transaction = usePollTransactionDetails(txId);

  return { txId, transaction };
}
