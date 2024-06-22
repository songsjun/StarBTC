import { defaultChainConfig } from "@config/chains";
import { LoanContract, LoanContract__factory } from "@contracts/types";
import { useActiveEVMChainConfig } from "@services/chains/hooks/useActiveEVMChainConfig";
import { useEVMProvider } from "@services/evm/hooks/useEVMProvider";
import { useWeb3React } from "@web3-react/core";
import { useMemo } from "react";

/**
 * For read/write operations, everything goes through the wallet provider (metamask, etc)
 */
export const useActiveChainOrderFactoryContractInstance = (): LoanContract => {
  const { provider } = useWeb3React();
  const chainConfig = useActiveEVMChainConfig();

  if (chainConfig && !chainConfig.contracts.orderFactory)
    throw new Error("No loan factory contract address defined in global config for current network, eventhough current network is supported by the app");

  // Initialize the factory whenever the chain config (active network) changes
  return useMemo(() => {
    if (chainConfig)
      return LoanContract__factory.connect(chainConfig.contracts.orderFactory, provider?.getSigner());
    else
      return undefined;
  }, [chainConfig, provider]);
}

/**
 * For read only operations where we want to be able to access on chain data with no wallet connected, we:
 * - goes through the connected wallet, if any.
 * - if no wallet, we use the default network of this app, which is ESC.
 */
export const useReadOnlyOrderFactoryContractInstance = (): LoanContract => {
  const activeChainConfig = useActiveEVMChainConfig();
  const chainConfig = activeChainConfig || defaultChainConfig;
  const readOnlyProvider = useEVMProvider(chainConfig.chainId);

  if (chainConfig && !chainConfig.contracts.orderFactory)
    throw new Error("No loan factory contract address defined in global config for current network, eventhough current network is supported by the app");

  // Reinitialize the factory whenever the chain config changes
  return useMemo(() => {
    if (chainConfig)
      return LoanContract__factory.connect(chainConfig.contracts.orderFactory, readOnlyProvider);
    else
      return undefined;
  }, [chainConfig, readOnlyProvider]);
}
