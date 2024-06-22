import { useBehaviorSubject } from "@services/ui-ux/hooks/useBehaviorSubject";
import { useCallback, useEffect, useState } from "react";
import { useInterval } from "react-use";
import { LoanOrder, LoanOrderStatus } from "../../model/loan-order";

const TAKEN_ORDER_EXPIRATION_MINUTES = 6 * 60; // 6 hours

/**
 * Tells when an order that is in taken state has expired, meaning that the taker
 * did not pay btc/prove btc on time. In that case, order creator can cancel the order.
 */
export const useOrderTakenExpiration = (order: LoanOrder) => {
  const [expirationDate, setExpirationDate] = useState<Date>(undefined);
  const [isExpired, setIsExpired] = useState<boolean>(undefined);
  const takenAt = useBehaviorSubject(order.takenAt$);

  useEffect(() => {
    if (order && takenAt && order.status$.value === LoanOrderStatus.TAKEN) {
      const expDate = new Date(takenAt.getTime() + (TAKEN_ORDER_EXPIRATION_MINUTES * 60) * 1000);
      setExpirationDate(expDate);
      setIsExpired(Date.now() > expDate.getTime());
    }
    else {
      // No order or not in TAKEN status, consider as not expired
      setExpirationDate(undefined);
      setIsExpired(undefined);
    }
  }, [order, takenAt]);

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