import { JsonRpcProvider } from "@ethersproject/providers";
import { getChainConfigById } from "@services/chains/chains";

const providerCache: { [chainId: number]: JsonRpcProvider } = {};

/* class Test extends JsonRpcProvider {

} */

/**
 * Returns a read only web3 provider for the given chain config.
 * Cached.
 */
export const useEVMProvider = (chainId: number): JsonRpcProvider => {
  if (!chainId)
    return undefined;

  if (!(chainId in providerCache)) {
    const chainConfig = getChainConfigById(chainId);
    providerCache[chainId] = new JsonRpcProvider(chainConfig.rpcs[0]);
  }

  return providerCache[chainId]
}