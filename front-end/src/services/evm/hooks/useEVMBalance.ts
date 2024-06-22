import { useWeb3React } from "@web3-react/core";
import BigNumber from "bignumber.js";
import { useCallback, useEffect, useState } from "react";
import { utils } from "web3";
import { useEVMWallet } from "./useEVMWallet";

/**
 * Returns the number of native coins owned by the active EVM account.
 * Readable format for display
 */
export const useEVMBalance = (decimals: number = 2) => {
  const { account } = useEVMWallet();
  const { provider } = useWeb3React();
  const [balance, setBalance] = useState<string>(undefined);

  const refreshBalance = useCallback(() => {
    if (!account || !provider) {
      setBalance(undefined);
      return;
    }

    provider?.getBalance(account).then((_balance) => {
      const etherBalance = new BigNumber(utils.fromWei(_balance.toString(), "ether")).toFixed(decimals);
      setBalance(etherBalance);
    }).catch(() => {
      setBalance(undefined);
    });
  }, [account, provider, decimals]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  return { balance, refreshBalance };
}