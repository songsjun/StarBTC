import { defaultChainConfig } from "@config/chains";
import { Order__factory } from "@contracts/types";
import { useActiveEVMChainConfig } from "@services/chains/hooks/useActiveEVMChainConfig";
import { useEVMProvider } from "@services/evm/hooks/useEVMProvider";
import { useWeb3React } from "@web3-react/core";
import { isAddress } from "ethers/lib/utils";
import { useCallback } from "react";

export const useOrderContractInstance = () => {
  const { provider } = useWeb3React();
  const activeChainConfig = useActiveEVMChainConfig();
  const chainConfig = activeChainConfig || defaultChainConfig;
  const readOnlyProvider = useEVMProvider(chainConfig.chainId);

  const getActiveChainInstance = useCallback((orderContractAddress: string) => {
    if (!isAddress(orderContractAddress))
      throw new Error(`Invalid order contract address ${orderContractAddress}`);

    return Order__factory.connect(orderContractAddress, provider?.getSigner());
  }, [provider]);

  const getReadOnlyInstance = useCallback((orderContractAddress: string) => {
    if (!isAddress(orderContractAddress))
      throw new Error(`Invalid order contract address ${orderContractAddress}`);

    return Order__factory.connect(orderContractAddress, readOnlyProvider);
  }, [readOnlyProvider]);

  return { getActiveChainInstance, getReadOnlyInstance };
}
