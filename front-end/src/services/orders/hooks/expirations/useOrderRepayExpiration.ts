import { useBehaviorSubject } from "@services/ui-ux/hooks/useBehaviorSubject";
import { useCallback, useEffect, useState } from "react";
import { useInterval } from "react-use";
import { LoanOrder } from "../../model/loan-order";

/**
 * Expiration time between borrow and repayment
 */
export const useOrderRepayExpiration = (order: LoanOrder) => {
  const [expirationDate, setExpirationDate] = useState<Date>(undefined);
  const [isExpired, setIsExpired] = useState<boolean>(undefined);
  const borrowedAt = useBehaviorSubject(order.borrowedAt$);

  useEffect(() => {
    if (order && borrowedAt) {
      const expDate = new Date(borrowedAt.getTime() + (order.duration * 24 * 60 * 60) * 1000);
      setExpirationDate(expDate);
      setIsExpired(Date.now() > expDate.getTime());
    }
    else {
      // No order, no information
      setExpirationDate(undefined);
    }
  }, [order, borrowedAt]);

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