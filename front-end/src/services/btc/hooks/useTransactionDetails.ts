import { BTCTransaction } from "@services/nownodes-api/model/types";
import { getTransactionDetails } from "@services/nownodes-api/nownodes-api";
import { useEffect, useState } from "react";
import { isNullBitcoinTxId } from "../btc";

/**
 * Returns BTC transaction details.
 */
export const useTransactionDetails = (txId: string) => {
  const [details, setDetails] = useState<BTCTransaction>(undefined);

  useEffect(() => {
    if (isNullBitcoinTxId(txId)) {
      setDetails(undefined);
      return;
    }

    getTransactionDetails(txId).then(setDetails);
  }, [txId]);

  return details;
}

/**
 * Returns BTC transaction details repeatedly.
 */
export const usePollTransactionDetails = (txId: string, repeatIntervalMs = 10000) => {
  const [details, setDetails] = useState<BTCTransaction>(undefined);

  useEffect(() => {
    if (!txId || !repeatIntervalMs)
      return;

    let timer = setInterval(() => {
      getTransactionDetails(txId).then(setDetails);
    }, repeatIntervalMs);

    getTransactionDetails(txId).then(setDetails);

    return () => {
      clearInterval(timer);
    }
  }, [txId, repeatIntervalMs]);

  return details;
}