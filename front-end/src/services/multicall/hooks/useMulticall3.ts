import { defaultChainConfig } from "@config/chains";
import { Multicall3, Multicall3__factory } from "@contracts/types";
import { useActiveEVMChainConfig } from "@services/chains/hooks/useActiveEVMChainConfig";
import { useEVMProvider } from "@services/evm/hooks/useEVMProvider";
import { BytesLike } from "ethers";
import { useCallback, useMemo } from "react";

export const useReadOnlyContractInstance = (): Multicall3 => {
  const activeChainConfig = useActiveEVMChainConfig();
  const chainConfig = activeChainConfig || defaultChainConfig;
  const readOnlyProvider = useEVMProvider(chainConfig.chainId);

  if (chainConfig && !chainConfig.contracts.multicall3)
    throw new Error("No multicall3 contract address defined in global config for current network, eventhough current network is supported by the app");

  // Reinitialize the factory whenever the chain config changes
  return useMemo(() => {
    if (chainConfig)
      return Multicall3__factory.connect(chainConfig.contracts.multicall3, readOnlyProvider);
    else
      return undefined;
  }, [chainConfig, readOnlyProvider]);
}

export const useMulticall3 = () => {
  const contractInstance = useReadOnlyContractInstance();

  const singleContractMulticall = useCallback(async (contractAddress: string, calls: BytesLike[]) => {
    const input: Multicall3.Call3Struct[] = calls.map(callData => ({
      target: contractAddress,
      allowFailure: true, // backward compatibility for orders that don't have all the fields
      callData
    }));
    // console.log("multicall input", input)
    const output = await contractInstance.aggregate3(input);
    // console.log("multicall output", output);

    return output?.map(o => o.returnData);
  }, [contractInstance]);

  return { singleContractMulticall };
}