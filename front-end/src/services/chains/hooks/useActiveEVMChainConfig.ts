import { defaultChainConfig } from "@config/chains";
import { useEVMWallet } from "@services/evm/hooks/useEVMWallet";
import { getChainConfigById } from "../chains";

/**
 * Returns the currently active chain in the connected EVM wallet.
 * If not connected or if chain is not supported, returns the default
 * chain config (elastos)
 */
export const useActiveEVMChainConfig = (useDefaultIfNeeded = true) => {
  const { chainId } = useEVMWallet();
  const chainConfig = getChainConfigById(chainId);
  if (chainConfig)
    return chainConfig;

  if (useDefaultIfNeeded)
    return defaultChainConfig;

  return undefined;
}