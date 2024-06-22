import { chainList } from "@config/chains";
import { ErrorCode, MetaMaskErrorCode, useErrorHandler } from "@contexts/ErrorHandlerContext";
import { WalletContext } from "@contexts/WalletContext";
import { Web3Provider } from "@ethersproject/providers";
import { ChainConfig } from "@services/chains/chain-config";
import { useWeb3React } from "@web3-react/core";
import { TypedDataDomain, TypedDataField } from "ethers";
import { useCallback, useContext, useEffect } from "react";
import Web3 from "web3";

/**
 * Requests the active wallet to add our main EVM network (from config) in its settings
 */
const addNetwork = async (provider: Web3Provider, chain: ChainConfig) => {
  console.log("Asking wallet to add chain:", chain);
  try {
    await provider.provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: Web3.utils.toHex(chain.chainId),
          chainName: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: chain.rpcs,
          blockExplorerUrls: chain.explorers,
        },
      ],
    });
  } catch (addingNetworkErr) {
    throw addingNetworkErr;
  }
};

/**
 * Hook to connect and disconnect the EVM wallet, and know the active EVM account address and
 * active EVM chain ID.
 */
export const useEVMWallet = () => {
  // Use context to persist this account value across all components
  const { evmAccount, setEvmAccount, evmChainId, setEvmChainId, networkMode } = useContext(WalletContext);
  // "connector" defaults to Metamask injected here (configured in context provider).
  // isActive is false when the app restart, even for metamask injected. Is only because true (and provides "account") when activate() is called.
  const { connector, provider, isActive, chainId: connectorChainId, account: connectorAccount } = useWeb3React();
  const { handleError } = useErrorHandler();
  const defaultNetworkToUse = chainList.find(c => c.networkMode === networkMode); // Use the first network of the list that supports the current network mode

  // Only apply app account to the account given by the connector IF the connector is active.
  // That's because we want to use the local storage account value by default (if connector is disconnected)
  // But we want to refresh account with the real account from the connector, if there is an active connector.
  //
  // NOTE: when disconnecting from metamask, both connectorAccount and isActive (to false) change at the same time so we
  // currently can't update setEvmAccount. We could probably detect that with an event listener on the provider.
  useEffect(() => {
    if (isActive) {
      setEvmAccount(connectorAccount);
    }
  }, [connectorAccount, isActive, setEvmAccount]);

  useEffect(() => {
    if (isActive) {
      setEvmChainId(connectorChainId);
    }
  }, [connectorChainId, isActive, setEvmChainId]);

  /**
   * Requests the active wallet to switch to our main network, if not already there.
   */
  const switchNetwork = useCallback(async (chain: ChainConfig) => {
    console.log("Asking wallet to switch to chain:", chain);
    await provider?.provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: Web3.utils.toHex(chain.chainId) }],
    });
  }, [provider]);

  const switchNetworkOrAddDefault = useCallback(async () => {
    try {
      await switchNetwork(defaultNetworkToUse);
    } catch (networkError: any) {
      const { code } = networkError as { code: number; message: string; };
      if (code === MetaMaskErrorCode.UNRECOGNIZED_CHAIN_ERR_CODE) {
        try {
          await addNetwork(provider, defaultNetworkToUse); // Elastos testnet for now
        }
        catch (e) {
          // Possibly "Request of type 'wallet_addEthereumChain' already pending". Silent error
          console.warn("Add network error:", e);
        }
      } else {
        handleError(networkError, evmAccount);
      }
    }
  }, [switchNetwork, defaultNetworkToUse, provider, handleError, evmAccount]);

  /**
   * Handles the whole process of connecting to the EVM wallet and adding/switching to our
   * main EVM network if necessary.
   *
   * Do NOT call this method automatically, wait for user action.
   */
  const handleConnect = useCallback(async () => {
    console.log("Trying to connect to EVM wallet");

    try {
      // This activates the default connector if only one. If multiple connectors,
      // the target connector instance must be given to activate().
      await connector.activate();
      connector.connectEagerly?.();
    } catch (networkError) {
      const error = (networkError as any).code as ErrorCode;
      if (error !== MetaMaskErrorCode.UNRECOGNIZED_CHAIN_ERR_CODE) {
        handleError(networkError, evmAccount);
      }
    }
  }, [connector, evmAccount, handleError]);

  /**
   * Disconnects the EVM wallet from this app.
   */
  const handleDisconnect = useCallback(async () => {
    if (connector.deactivate) {
      await connector.deactivate();
    } else {
      await connector.resetState();
    }
    setEvmAccount(undefined);
  }, [connector, setEvmAccount]);

  const signDataV4 = useCallback(async (domain: TypedDataDomain, types: Record<string, TypedDataField[]>, value: Record<string, any>): Promise<string> => {
    try {
      const signature = await provider.getSigner()._signTypedData(domain, types, value);
      return signature;
    }
    catch (e) {
      console.warn("signDatav4 error:", e);
      return undefined;
    }
  }, [provider]);

  return {
    handleConnect,
    handleDisconnect,
    switchNetworkOrAddDefault,
    signDataV4,
    connectorIsActive: isActive,
    /**
     * The EVM account is known, possibly from local storage.
     * This doesnt mean the wallet is still actively connected and ready. connectorIsActive must be checked
     * before any call the the evm provider.
    */
    account: evmAccount,
    chainId: evmChainId,
  };
};
