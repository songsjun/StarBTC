import { useBehaviorSubject } from "@services/ui-ux/hooks/useBehaviorSubject";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import { useInterval } from "react-use";
import { LoanOrder, LoanOrderStatus } from "../../model/loan-order";

/**
 * Expiration time for the borrower, between either:
 * - the time his BTC transfer to the lock script has been submitted, and the time he borrows the tokens.
 * - or lender's manual confirmation time and borrow time.
 * If the borrower doesn't borrow on time, the order can be closed. The borrower can request an arbitration later though.
 */
export const useOrderBorrowExpiration = (order: LoanOrder) => {
  const [expirationDate, setExpirationDate] = useState<Date>(undefined);
  const [isExpired, setIsExpired] = useState<boolean>(undefined);
  const borrowerProofSubmittedAt = useBehaviorSubject(order.borrowerProofSubmittedAt$);
  const lenderManuallyConfirmedBTCAt = useBehaviorSubject(order.lenderManuallyConfirmedBTCAt$);
  const status = useBehaviorSubject(order.status$);

  useEffect(() => {
    if (!order) {
      setExpirationDate(undefined);
      setIsExpired(undefined);
    }
    else {
      if (status === LoanOrderStatus.BORROWER_PROOF_SUBMITTED) {
        var expirationDate = moment(borrowerProofSubmittedAt).add(order.submitProofExpirationDuration, "seconds");
        setExpirationDate(expirationDate.toDate());
        setIsExpired(Date.now() > expirationDate.toDate().getTime());
      }
      else if (status === LoanOrderStatus.BORROWER_PAYMENT_CONFIRMED) {
        var expirationDate = moment(lenderManuallyConfirmedBTCAt).add(order.borrowExpirationDuration, "seconds");
        setExpirationDate(expirationDate.toDate());
        setIsExpired(Date.now() > expirationDate.toDate().getTime());
      }
      else {
        setExpirationDate(undefined);
        setIsExpired(undefined);
      }
    }
  }, [borrowerProofSubmittedAt, lenderManuallyConfirmedBTCAt, order, status]);

  const checkExpired = useCallback(() => {
    if (expirationDate)
      setIsExpired(Date.now() > expirationDate.getTime());
    else
      setIsExpired(undefined);
  }, [expirationDate]);

  // Repeated update
  useInterval(checkExpired, 1000);

  // Initial update
  useEffect(() => {
    checkExpired();
  }, [checkExpired]);

  return { expirationDate, isExpired };
}