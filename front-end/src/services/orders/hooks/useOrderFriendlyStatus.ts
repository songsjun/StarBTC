import { useBehaviorSubject } from "@services/ui-ux/hooks/useBehaviorSubject";
import { LoanOrder, LoanOrderStatus, LoanOrderVerificationStatus } from "../model/loan-order";
import { useOrderBorrowerVerificationStatus } from "./useOrderVerificationStatus";

/**
 * Returns a user friendly string representing the order status.
 */
export const useOrderFriendlyStatus = (order: LoanOrder): string => {
  const status = useBehaviorSubject(order.status$);
  const borrowerVerificationStatus = useOrderBorrowerVerificationStatus(order);

  switch (status) {
    case LoanOrderStatus.CREATED: return "Open";
    case LoanOrderStatus.TAKEN: return "Taken";
    case LoanOrderStatus.BORROWER_PROOF_SUBMITTED:
      if (borrowerVerificationStatus === LoanOrderVerificationStatus.PENDING)
        return "Verif. BTC locking";
      else if (borrowerVerificationStatus === LoanOrderVerificationStatus.VERIFIED)
        return "Pending token claim"
      else if (borrowerVerificationStatus === undefined)
        return "Checking";
      else
        return "BTC verif. failed";
    case LoanOrderStatus.BORROWED: return "Borrowed";
    case LoanOrderStatus.REPAID: return "Repaid, pending BTC unlock";
    case LoanOrderStatus.LENDER_PROOF_SUBMITTED: return "Verif. BTC unlocking";
    case LoanOrderStatus.BORROWER_PAYMENT_CONFIRMED: return "Borrower payment confirmed";
    case LoanOrderStatus.LENDER_PAYMENT_CONFIRMED: return "Lender payment confirmed";
    case LoanOrderStatus.ARBITRATION_REQUESTED: return "Arbitration";
    case LoanOrderStatus.CLOSED: return "Closed";
    default: return "Unknown";
  }
}