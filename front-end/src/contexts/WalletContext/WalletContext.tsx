import { useEVMWallet } from "@services/evm/hooks/useEVMWallet";
import { NetworkMode, networkMode$ } from "@services/network/network";
import { Web3ReactProvider } from "@web3-react/core";
import { createContext, FC, memo, ReactNode, useContext, useEffect, useState } from "react";
import { BehaviorSubject } from "rxjs";
import { connectors } from "./connectors";

const EVM_ACCOUNT_STORAGE_KEY = "evm-account";
const EVM_CHAIN_ID_STORAGE_KEY = "evm-chain-id";
const BITCOIN_ACCOUNT_STORAGE_KEY = "bitcoin-account";
const BITCOIN_PROVIDER_STORAGE_KEY = "bitcoin-provider";
const NETWORK_MODE_STORAGE_KEY = "network-mode";

export type BitcoinWalletProvider = "unisat" | "okx";

export type Web3ProviderProps = {
  children: ReactNode;
};

/**
 * RxJS subject in addition to hooks, to be able to deal with the active chain outside of react hooks (services).
 */
export const activeEVMChainId$ = new BehaviorSubject<number>(undefined);

/**
 * Automatically reconnects to the injected wallet, if we already have a known EVM account in local storage.
 * For example, metamask doesn't automatically reconnects when reloading the page.
 *
 * NOTE: Later when adding more wlalet support such as wallet connect we have to store the connector in use, and try to auto reconnect
 * only when the connector in use is the injected one. We don't want to auto reconnect to Wallet connect for example, as this would trigger a QR code modal.
 */
const AutoReconnect: FC<{ children: ReactNode }> = ({ children }) => {
  const { evmAccount } = useContext(WalletContext);
  const { handleConnect } = useEVMWallet();
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (connecting || !evmAccount || !window.ethereum)
      return;

    console.log("Reconnecting to the injected wallet provider");
    setConnecting(true);
    handleConnect();
  }, [evmAccount, handleConnect, connecting]);

  return children;
}

export const WalletProvider = memo(({ children }: Web3ProviderProps) => {
  // Restore account from local storage, even if connector is not connected any more.
  // It's ok to know the EVM account even if we need to reconnect to the connector for requests later on.
  const [evmAccount, setEvmAccount] = useState<string>(localStorage.getItem(EVM_ACCOUNT_STORAGE_KEY));
  const [bitcoinAccount, setBitcoinAccount] = useState<string>(localStorage.getItem(BITCOIN_ACCOUNT_STORAGE_KEY));
  const [bitcoinProvider, setBitcoinProvider] = useState<BitcoinWalletProvider>(localStorage.getItem(BITCOIN_PROVIDER_STORAGE_KEY) as BitcoinWalletProvider);
  const [networkMode, setNetworkMode] = useState<NetworkMode>(localStorage.getItem(NETWORK_MODE_STORAGE_KEY) as NetworkMode || "mainnet");

  const rawChainID = localStorage.getItem(EVM_CHAIN_ID_STORAGE_KEY);
  const [evmChainId, setEvmChainId] = useState<number>(rawChainID ? parseInt(rawChainID) : undefined);

  // Save account to local storage when it changes
  useEffect(() => {
    if (evmAccount)
      localStorage.setItem(EVM_ACCOUNT_STORAGE_KEY, evmAccount);
    else
      localStorage.removeItem(EVM_ACCOUNT_STORAGE_KEY);
  }, [evmAccount]);

  // Save chain ID to local storage when it changes
  useEffect(() => {
    if (evmChainId)
      localStorage.setItem(EVM_CHAIN_ID_STORAGE_KEY, `${evmChainId}`);
    else
      localStorage.removeItem(EVM_CHAIN_ID_STORAGE_KEY);
  }, [evmChainId]);

  // Save account to local storage when it changes
  useEffect(() => {
    if (bitcoinAccount)
      localStorage.setItem(BITCOIN_ACCOUNT_STORAGE_KEY, bitcoinAccount);
    else
      localStorage.removeItem(BITCOIN_ACCOUNT_STORAGE_KEY);
  }, [bitcoinAccount]);

  // Save network mode to local storage when it changes
  useEffect(() => {
    if (networkMode)
      localStorage.setItem(NETWORK_MODE_STORAGE_KEY, networkMode);
    else
      localStorage.removeItem(NETWORK_MODE_STORAGE_KEY);
  }, [networkMode]);

  useEffect(() => {
    if (bitcoinProvider)
      localStorage.setItem(BITCOIN_PROVIDER_STORAGE_KEY, bitcoinProvider);
    else
      localStorage.removeItem(BITCOIN_PROVIDER_STORAGE_KEY);
  }, [bitcoinProvider]);

  useEffect(() => {
    activeEVMChainId$.next(evmChainId);
  }, [evmChainId]);

  useEffect(() => {
    networkMode$.next(networkMode);
  }, [networkMode]);

  return (
    <WalletContext.Provider value={{ evmAccount, setEvmAccount, evmChainId, setEvmChainId, bitcoinAccount, setBitcoinAccount, bitcoinProvider, setBitcoinProvider, networkMode, setNetworkMode }}>
      <Web3ReactProvider connectors={connectors}>
        <AutoReconnect>
          {children}
        </AutoReconnect>
      </Web3ReactProvider>
    </WalletContext.Provider>
  );
});

type WalletContextProps = {
  evmAccount: string;
  setEvmAccount: (account: string) => void;
  bitcoinAccount: string;
  setBitcoinAccount: (account: string) => void;
  bitcoinProvider: BitcoinWalletProvider;
  setBitcoinProvider: (provider: BitcoinWalletProvider) => void;
  evmChainId: number;
  setEvmChainId: (chainId: number) => void;
  networkMode: NetworkMode;
  setNetworkMode: (mode: NetworkMode) => void;
}

export const WalletContext = createContext<WalletContextProps>(null);