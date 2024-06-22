import { Address, BigInt } from "@graphprotocol/graph-ts";

import { Order } from "../../generated/schema";
import { increaseOrderCount } from "./Global";
import { getUser, increaseCreatedOrdersCount, increaseTakenOrdersCount } from "./User";

export type GqlOrderType = string; // can't use string enums because of webassembly

export type GqlOrderStatus = string;

/**
 * Gets the existing order if any, otherwise create a new one.
 */
export function getOrder(orderId: string): Order {
  let existingOrder = Order.load(orderId);

  if (existingOrder)
    return existingOrder;

  let newOrder = new Order(orderId);

  return newOrder;
}

export function createOrder(
  creator: Address,
  orderId: string,
  type: GqlOrderType,
  token: Address,
  tokenAmount: BigInt,
  collateralAmount: BigInt,
  timestamp: i32): void {

  const order = getOrder(orderId);
  order.status = "CREATED";
  order.createdAt = timestamp;
  order.token = token.toHexString();
  order.tokenAmount = tokenAmount;
  order.collateralAmount = collateralAmount;

  const user = getUser(creator);

  order.type = type;
  if (type == "BORROW")
    order.borrower = user.id;
  else
    order.lender = user.id;

  order.save();

  increaseCreatedOrdersCount(creator);
  increaseOrderCount();
}

export function takeOrder(orderId: string, user: Address, takerBTCAddress: string, timestamp: i32): void {
  let order = getOrder(orderId);

  // NOTE: for some reason, order.type !== (strict) "LENDING" but it is == "LENDING"...
  if (order.type == "LENDING") {
    const borrower = getUser(user);
    order.borrower = borrower.id;
    order.borrowerBTCAddress = takerBTCAddress;
    order.status = "TAKEN";
    order.takenAt = timestamp;
    order.save();

    increaseTakenOrdersCount(user);
  }
  else {
    throw new Error(`takeOrder(): unhandled order type ${order.type}`);
  }
}

export function orderClosed(orderId: string): void {
  let order = getOrder(orderId);
  order.status = "CLOSED";
  // TODO: closedAt
  order.save();
}

export function orderBorrowerPaymentProofSubmitted(orderId: string): void {
  let order = getOrder(orderId);
  order.status = "BORROWER_PROOF_SUBMITTED";
  // TODO: date
  order.save();
}

export function orderLenderPaymentProofSubmitted(orderId: string): void {
  let order = getOrder(orderId);
  order.status = "LENDER_PROOF_SUBMITTED";
  // TODO: date
  order.save();
}

export function orderBorrowed(orderId: string): void {
  let order = getOrder(orderId);
  order.status = "BORROWED";
  // TODO: date
  order.save();
}

export function orderRepaid(orderId: string): void {
  let order = getOrder(orderId);
  order.status = "REPAID";
  // TODO: date
  order.save();
}

/**
 * Block-flexible mapping that adjust potential changes in contract enums (order change, deletions...) into 
 * more stable graphql values.
 * 
 * TODO: check block height to know when contract gets breaking changes in order to handle changing order type values differently.
 */
export function contractToGqlOrderType(contractOrderType: i32, blockHeight: number): GqlOrderType {
  switch (contractOrderType) {
    case 0: return "BORROW";
    case 1: return "LENDING";
    default: throw new Error(`Unhandled contract order type value ${contractOrderType}`)
  }
}

/* export function contractToGqlOrderStatus(contractOrderStatus: i32, blockHeight: number): GqlOrderStatus {
  switch (contractOrderStatus) {
    case 0: return "UNKNOWN";
    case 1: return "CREATED";
    case 2: return "TAKEN";
    case 3: return "BORROWER_PROOF_SUBMITTED";
    case 4: return "BORROWER_PAYMENT_CONFIRMED";
    case 5: return "BORROWED";
    case 6: return "REPAID";
    case 7: return "LENDER_PROOF_SUBMITTED";
    case 8: return "LENDER_PAYMENT_CONFIRMED";
    case 9: return "ARBITRATION_REQUESTED";
    case 10: return "CLOSED";
    default: throw new Error(`Unhandled contract order status value ${contractOrderStatus}`)
  }
} */