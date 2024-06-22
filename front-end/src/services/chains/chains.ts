import { chainList } from "@config/chains";
import { TokenOrNative } from "@services/tokens/token-or-native";
import { ChainConfig } from "./chain-config";

export const getChainConfigById = (chainId: number | undefined): ChainConfig | undefined => {
  if (!chainId)
    return undefined;

  return chainList.find(config => config.chainId === chainId);
}

export const getChainNativeToken = (chain: ChainConfig): TokenOrNative => {
  return chain?.tokens.find(t => t.isNative);
}