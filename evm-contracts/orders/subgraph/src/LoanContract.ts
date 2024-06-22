import { OrderCreated } from "../generated/LoanContract/LoanContract";
import { Order } from "../generated/templates";
import { contractToGqlOrderType, createOrder } from "./entities/Order";
import { createOrderChange } from "./entities/OrderChange";

export function handleOrderCreated(event: OrderCreated): void {
    createOrder(
        event.transaction.from,
        event.params.orderId.toHexString(),
        contractToGqlOrderType(event.params.orderType, -1), // LENDING / BORROW
        event.params.token,
        event.params.tokenAmount,
        event.params.collateral,
        event.block.timestamp.toI32()
    );
    createOrderChange(event, event.params.orderId.toHexString(), "CREATED");

    // Start indexing every new order contract events dynamically
    Order.create(event.params.orderId);
}
