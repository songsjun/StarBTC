import { BTCBlock } from "@services/nownodes-api/model/types";
import { getBestBlockHash, getBlock } from "@services/nownodes-api/nownodes-api";
import { useCallback, useEffect, useState } from "react";

/**
 * Returns the latest block info of bitcoin network.
 */
export const useCurrentBlock = () => {
  const [block, setBlock] = useState<BTCBlock>(undefined);

  const refreshBlockInfo = useCallback(async () => {
    const bestBlockHash = await getBestBlockHash();
    const info = await getBlock(bestBlockHash?.backend.bestBlockHash);
    setBlock(info?.blockInfo);
  }, []);

  useEffect(() => {
    refreshBlockInfo();
  }, [refreshBlockInfo]);

  return { block, refreshBlockInfo };
}