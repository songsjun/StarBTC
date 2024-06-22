import { useTransactionDetails } from "@services/btc/hooks/useTransactionDetails";
import { scriptTimelockToSeconds } from "@services/orders/timelocks";
import { useBehaviorSubject } from "@services/ui-ux/hooks/useBehaviorSubject";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import { useInterval } from "react-use";
import { LoanOrder } from "../../model/loan-order";

export const useLenderTimelock = (order: LoanOrder) => {
  const [exceeded, setExceeded] = useState<boolean>(undefined);
  const btcTxIds = useBehaviorSubject(order.toLenderBtcTx);
  const tx = useTransactionDetails(btcTxIds.txId);
  const [remainingTime, setRemainingTime] = useState<number>(undefined);

  const refresh = useCallback(() => {
    if (!tx) {
      setExceeded(undefined);
      return;
    }

    const timeLockInSeconds = tx.blockTime + scriptTimelockToSeconds(order.lockTime1);
    const remainingSeconds = Math.max(0, timeLockInSeconds - moment().unix());

    setExceeded(remainingSeconds === 0);
    setRemainingTime(remainingSeconds);
  }, [order, tx]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useInterval(refresh, 1000);

  return {
    /** Whether current time is after lender's timelock time or not */
    exceeded,
    /** Number of seconds before lender's timelock time is reached */
    remainingTime
  };
}