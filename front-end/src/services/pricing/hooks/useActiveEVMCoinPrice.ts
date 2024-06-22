import { useActiveEVMChainConfig } from "@services/chains/hooks/useActiveEVMChainConfig";
import { useCoinPrice } from "./useCoinPrice";

/**
 * Returns the USD valuation of the currently ACTIVE EVM network's native token.
 * For example if network is ESC, this returns current ELA/ETH value in USD.
 */
export const useActiveEVMCoinPrice = (): number | undefined => {
    const chainConfig = useActiveEVMChainConfig();
    return useCoinPrice(chainConfig?.nativeCurrency.symbol);
}