import { WalletContext } from "@contexts/WalletContext";
import { useActiveEVMChainConfig } from "@services/chains/hooks/useActiveEVMChainConfig";
import { useCallback, useContext, useEffect, useState } from "react";
import { useInterval } from "react-use";
import { fetchLockedBTC } from "../../subgraph/subgraph";

/**
 * Returns the amount of locked BTC for the currently active BTC account
 */
export const useLockedBTC = () => {
  const chain = useActiveEVMChainConfig(false);
  const { bitcoinAccount } = useContext(WalletContext);
  const [lockedBTCAmount, setLockedBTCAmount] = useState<number>(undefined);
  useInterval(() => fetch(), 10000);

  const fetch = useCallback(async () => {
    if (!bitcoinAccount) {
      setLockedBTCAmount(undefined);
      return;
    }

    const { lockedBTCAmount } = (await fetchLockedBTC(chain, bitcoinAccount)) || {};
    setLockedBTCAmount(lockedBTCAmount);
  }, [bitcoinAccount, chain]);

  useEffect(() => { fetch() }, [fetch]);

  return {
    lockedBTCAmount
  }
}