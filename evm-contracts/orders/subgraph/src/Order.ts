import { ArbitrationRequested, BorrowSuccessful, BorrowerBTCTransferProofSubmitted, LenderBTCTransferProofSubmitted, OrderClosed, OrderTaken, RepaymentMade } from "../generated/templates/Order/Order";
import { orderBorrowed, orderBorrowerPaymentProofSubmitted, orderClosed, orderLenderPaymentProofSubmitted, orderRepaid, takeOrder } from "./entities/Order";

/**
 * First step after order creation, when a borrower accepts to take the (lending) order.
 * Order status is now TAKEN.
 */
export function handleOrderTaken(event: OrderTaken): void {
    takeOrder(
        event.params.orderId.toHexString(),
        event.transaction.from,
        event.params.takerBtcAddress,
        event.block.timestamp.toI32()
    );
}

/**
 * Emitted when the proof of BTC payment from the borrower has been submitted (NOT verified yet).
 * Order status is now BORROWER_PROOF_SUBMITTED.
 */
export function handleBorrowerBtcTransferProofSubmitted(event: BorrowerBTCTransferProofSubmitted): void {
    orderBorrowerPaymentProofSubmitted(event.params.orderId.toHexString())
}

/**
 * Emitted when the proof of regular BTC unlock from the lender has been submitted (NOT verified yet).
 * Order status is now LENDER_PROOF_SUBMITTED.
 */
export function handleLenderBtcTransferProofSubmitted(event: LenderBTCTransferProofSubmitted): void {
    orderLenderPaymentProofSubmitted(event.params.orderId.toHexString())
}

/**
 * Emitted after the borrower's BTC payment has been proven, then claimBorrowedToken() has been called.
 * Lent tokens are not transfered to the borrower. Order status is now BORROWED.
 */
export function handleBorrowSuccessful(event: BorrowSuccessful): void {
    orderBorrowed(event.params.orderId.toHexString())
}

export function handleOrderClosed(event: OrderClosed): void {
    orderClosed(event.params.orderId.toHexString())
}

export function handleRepaymentMade(event: RepaymentMade): void {
    orderRepaid(event.params.orderId.toHexString())
}

export function handleArbitrationRequested(event: ArbitrationRequested): void {

}
