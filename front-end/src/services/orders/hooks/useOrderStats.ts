import { useActiveEVMChainConfig } from "@services/chains/hooks/useActiveEVMChainConfig";
import { useCallback, useEffect, useState } from "react";
import { useInterval } from "react-use";
import { fetchAllFilledOrdersStats } from "../../subgraph/subgraph";

/**
 * Returns statistics about orders: amount of ela, amount of btc, usd values.
 * Automatically updating
 */
export const useOrderStats = () => {
  const [usdtAmount, setUsdtAmount] = useState<number>(undefined);
  const [usdcAmount, setUsdcAmount] = useState<number>(undefined);
  const [btcAmount, setBtcAmount] = useState<number>(undefined);
  useInterval(() => fetch(), 10000);
  const activeChain = useActiveEVMChainConfig(true);

  const fetch = useCallback(async () => {
    const { usdtSum, usdcSum, btcSum } = (await fetchAllFilledOrdersStats(activeChain)) || {};
    setUsdtAmount(usdtSum);
    setUsdcAmount(usdcSum);
    setBtcAmount(btcSum);
  }, [activeChain]);

  useEffect(() => { fetch() }, [fetch]);

  return {
    usdtAmount,
    usdcAmount,
    btcAmount
  }
}