import { ethereum } from "@graphprotocol/graph-ts";

import { OrderChange } from "../../generated/schema";
import { getChangeSequenceNumber } from "./Global";
import { getOrder } from "./Order";
import { getTransaction } from "./Transaction";

export function createOrderChange(event: ethereum.Event, orderId: string, newStatus: string): void {
  let sequenceNumber = getChangeSequenceNumber();
  let change = new OrderChange(sequenceNumber.toString());

  let transactionId = getTransaction(event).id;
  change.transaction = transactionId;
  change.sequenceNumber = sequenceNumber;

  let order = getOrder(orderId);
  change.order = order.id;
  change.orderStatusBefore = order.status;
  change.orderStatusAfter = newStatus;

  change.save();
}
