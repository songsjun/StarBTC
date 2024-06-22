import { TokenOrNative } from "@services/tokens/token-or-native";
import { useActiveEVMChainConfig } from "./useActiveEVMChainConfig";

/**
 * Returns the native coin of the currently active chain.
 */
export const useActiveChainNativeCoin = (): TokenOrNative => {
  const activeChain = useActiveEVMChainConfig();
  return activeChain?.tokens.find(t => t.isNative);
}