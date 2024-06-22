import { useActiveEVMChainConfig } from "@services/chains/hooks/useActiveEVMChainConfig";
import BigNumber from "bignumber.js";
import { useCallback, useEffect, useState } from "react";
import { useERC20Contract } from "./useERC20Contract";
import { useEVMWallet } from "./useEVMWallet";

/**
 * Returns the number of token coins owned by the active EVM account.
 */
export const useERC20Balance = (symbol: string) => {
  const { account } = useEVMWallet();
  const activeChain = useActiveEVMChainConfig();
  const token = activeChain?.tokens.find(t => t.symbol === symbol);
  const [contractBalance, setContractBalance] = useState<BigNumber>(undefined);
  const [displayBalance, setDisplayBalance] = useState<string>(undefined);
  const { getBalance } = useERC20Contract(token?.contractAddress);

  const refreshBalance = useCallback(() => {
    if (!account || !token || token.isNative) {
      setDisplayBalance(undefined);
      setContractBalance(undefined);
      return;
    }

    getBalance(account).then((rawBalance) => {
      const formattedBalance = rawBalance.toFixed(token.displayDecimals);
      setDisplayBalance(formattedBalance);
      setContractBalance(rawBalance);
    }).catch(() => {
      setContractBalance(undefined);
    });
  }, [account, getBalance, token]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  return {
    contractBalance, /** Human readable number of tokens */
    displayBalance, /** String formatted with limited decimals */
    refreshBalance,
    token
  };
}