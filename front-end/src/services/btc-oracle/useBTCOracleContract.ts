import { BTCData, BTCData__factory } from "@contracts/types";
import { useActiveEVMChainConfig } from "@services/chains/hooks/useActiveEVMChainConfig";
import { useEVMProvider } from "@services/evm/hooks/useEVMProvider";
import { useWeb3React } from "@web3-react/core";
import { useCallback, useMemo } from "react";

const useContractInstance = (): BTCData => {
  const chainConfig = useActiveEVMChainConfig();
  const { provider } = useWeb3React();
  const readOnlyProvider = useEVMProvider(chainConfig?.chainId);

  if (chainConfig && !chainConfig.contracts.btcOracle)
    throw new Error("No BTC oracle contract address defined in global config for current network, eventhough current network is supported by the app");

  // Initialize the factory whenever the chain config (active network) changes
  return useMemo(() => {
    if (chainConfig) {
      return BTCData__factory.connect(chainConfig.contracts.btcOracle, provider?.getSigner() || readOnlyProvider);
    }
    else
      return undefined;
  }, [chainConfig, provider, readOnlyProvider]);
}

/**
 * Methods to access the the BTCData contract. This contract is not directly used by this front end app yet,
 * but this is useful to debug issues related to block height, merkle root, that are used by the order proof submitting
 * mechanism.
 */
export const useBTCOracleContract = () => {
  const contractInstance = useContractInstance();

  const getBlockByHeight = useCallback(async (blockHeight: number) => {
    try {
      const block = await contractInstance.getBlockByHeight(blockHeight);
      return block;
    }
    catch (e) {
      // Potential error: "No block exists at this height"
      console.warn("getBlockByHeight():", e);
      return undefined;
    }
  }, [contractInstance]);

  return {
    /**
     * Gets the block data that was saved by the oracle backend into the contract for a given bitcoin chain block height
     */
    getBlockByHeight,
  }
}