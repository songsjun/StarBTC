import { useActiveEVMChainConfig } from "@services/chains/hooks/useActiveEVMChainConfig";

/**
 * Returns the TokenOrNative object matching the given symbol on the current active chain
 */
export const useTokenFromSymbol = (symbol: string) => {
  const activeChain = useActiveEVMChainConfig();
  return activeChain?.tokens.find(t => t.symbol === symbol);
}