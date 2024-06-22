import { defaultChainConfig } from "@config/chains";
import { Interest, Interest__factory } from "@contracts/types";
import { useActiveEVMChainConfig } from "@services/chains/hooks/useActiveEVMChainConfig";
import { useEVMProvider } from "@services/evm/hooks/useEVMProvider";
import { useMemo } from "react";

export const useInterestContractInstance = (): Interest => {
  const activeChainConfig = useActiveEVMChainConfig();
  const chainConfig = activeChainConfig || defaultChainConfig;
  const readOnlyProvider = useEVMProvider(chainConfig.chainId);

  if (chainConfig && !chainConfig.contracts.interest)
    throw new Error("No interest contract address defined in global config for current network, eventhough current network is supported by the app");

  // Reinitialize the factory whenever the chain config changes
  return useMemo(() => {
    if (chainConfig)
      return Interest__factory.connect(chainConfig.contracts.interest, readOnlyProvider);
    else
      return undefined;
  }, [chainConfig, readOnlyProvider]);
}
