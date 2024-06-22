import { defaultChainConfig } from "@config/chains";
import { useErrorHandler } from "@contexts/ErrorHandlerContext";
import { ERC20__factory } from "@contracts/types";
import { ERC20 } from "@contracts/types/ERC20";
import { useActiveEVMChainConfig } from "@services/chains/hooks/useActiveEVMChainConfig";
import { etherToStdBigNumber } from "@services/evm/bignumbers";
import { useWeb3Utility } from "@services/evm/hooks/useWeb3Utility";
import { TokenOrNative } from "@services/tokens/token-or-native";
import { getTokenByAddress, tokenToReadableValue } from "@services/tokens/tokens";
import { useWeb3React } from "@web3-react/core";
import BigNumber from "bignumber.js";
import { parseUnits } from "ethers/lib/utils";
import { useCallback, useMemo } from "react";
import { useEVMProvider } from "./useEVMProvider";

const useContractInstance = (tokenAddress: string): ERC20 => {
  const { provider } = useWeb3React();
  const chainConfig = useActiveEVMChainConfig();

  // Initialize the factory whenever the chain config (active network) changes
  return useMemo(() => {
    if (chainConfig && tokenAddress)
      return ERC20__factory.connect(tokenAddress, provider?.getSigner());
    else
      return undefined;
  }, [chainConfig, provider, tokenAddress]);
}

const useReadOnlyContractInstance = (tokenAddress: string): ERC20 => {
  const activeChainConfig = useActiveEVMChainConfig();
  const chainConfig = activeChainConfig || defaultChainConfig;
  const readOnlyProvider = useEVMProvider(chainConfig.chainId);

  // Reinitialize the factory whenever the chain config changes
  return useMemo(() => {
    if (chainConfig && tokenAddress)
      return ERC20__factory.connect(tokenAddress, readOnlyProvider);
    else
      return undefined;
  }, [chainConfig, readOnlyProvider, tokenAddress]);
}

/**
 * Methods to access standard ERC20 tokens methods
 */
export const useERC20Contract = (tokenAddress: string) => {
  const { submitTransaction } = useWeb3Utility();
  const { handleError } = useErrorHandler();
  const rwInstance = useContractInstance(tokenAddress);
  const roInstance = useReadOnlyContractInstance(tokenAddress);
  const activeChain = useActiveEVMChainConfig();
  const token = getTokenByAddress(activeChain, tokenAddress);

  const getBalance = useCallback(async (owner: string): Promise<BigNumber> => {
    try {
      const balance = await roInstance.balanceOf(owner);
      return tokenToReadableValue(etherToStdBigNumber(balance), token.decimals);
    }
    catch (e) {
      handleError(e);
      return undefined;
    }
  }, [roInstance, handleError, token]);

  const getAllowance = useCallback(async (owner: string, delegate: string): Promise<BigNumber> => {
    try {
      const allowance = await roInstance.allowance(owner, delegate);
      return tokenToReadableValue(etherToStdBigNumber(allowance), token.decimals);
    }
    catch (e) {
      handleError(e);
      return undefined;
    }
  }, [roInstance, handleError, token]);

  const approve = useCallback(async (delegate: string, token: TokenOrNative, amount: BigNumber): Promise<void> => {
    try {
      const approveAmount = parseUnits(amount.toString(), token.decimals);
      const tx = await rwInstance.populateTransaction.approve(delegate, approveAmount);
      await submitTransaction(tx, true);
    }
    catch (e) {
      handleError(e);
    }
  }, [rwInstance, submitTransaction, handleError]);

  return {
    /**
     * Returns balance in readable format (eth)
     */
    getBalance,
    /**
     * returns allowance in readable format (eth)
     */
    getAllowance,
    /**
     * Approves ERC20 token spending.
     * @amount display value, not contract value
     */
    approve
  }
}