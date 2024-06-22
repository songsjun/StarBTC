import { useBehaviorSubject } from "@services/ui-ux/hooks/useBehaviorSubject";
import { useCallback, useEffect, useState } from "react";
import { useInterval } from "react-use";
import { LoanOrder } from "../../model/loan-order";

/**
 * Expiration time between borrower repayment and lender unlocking the BTC
 */
export const useOrderRepayUnlockExpiration = (order: LoanOrder) => {
  const [expirationDate, setExpirationDate] = useState<Date>(undefined);
  const [isExpired, setIsExpired] = useState<boolean>(undefined);
  const repaidAt = useBehaviorSubject(order.repaidAt$);

  useEffect(() => {
    if (order && repaidAt) {
      const expDate = new Date(repaidAt.getTime() + order.repayToUnlockDuration * 1000);
      setExpirationDate(expDate);
    }
    else {
      // No order, no information
      setExpirationDate(undefined);
    }
  }, [order, repaidAt]);

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