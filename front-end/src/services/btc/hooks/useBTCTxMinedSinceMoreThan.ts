import { useElapsedTimeSinceTimestamp } from "@services/ui-ux/hooks/useElapsedTimeSinceBlockTime";
import { useTransactionDetails } from "./useTransactionDetails";

export const useBTCTxMinedSinceMoreThan = (btcTxId: string, moreThanSeconds: number) => {
  const txDetails = useTransactionDetails(btcTxId); // anyone gets this tx details, not related to local storage
  const secondsSinceTxMined = useElapsedTimeSinceTimestamp(txDetails?.blockTime);

  return secondsSinceTxMined === undefined ? undefined : secondsSinceTxMined > moreThanSeconds;
}