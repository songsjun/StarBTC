import { defaultChainConfig } from "@config/chains";
import { IArbitrator, IArbitrator__factory } from "@contracts/types";
import { useActiveEVMChainConfig } from "@services/chains/hooks/useActiveEVMChainConfig";
import { useEVMProvider } from "@services/evm/hooks/useEVMProvider";
import { useMemo } from "react";

export const useArbitratorContractInstance = (): IArbitrator => {
  const activeChainConfig = useActiveEVMChainConfig();
  const chainConfig = activeChainConfig || defaultChainConfig;
  const readOnlyProvider = useEVMProvider(chainConfig.chainId);

  if (chainConfig && !chainConfig.contracts.arbitrator)
    throw new Error("No arbitrator contract address defined in global config for current network, eventhough current network is supported by the app");

  // Reinitialize the factory whenever the chain config changes
  return useMemo(() => {
    if (chainConfig)
      return IArbitrator__factory.connect(chainConfig.contracts.arbitrator, readOnlyProvider);
    else
      return undefined;
  }, [chainConfig, readOnlyProvider]);
}
