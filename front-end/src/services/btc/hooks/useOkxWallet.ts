import { WalletContext } from "@contexts/WalletContext";
import { isMainnetNetworkInUse } from "@services/network/network";
import { useCallback, useContext, useEffect } from "react";

/**
 * Hook to connect/disconnect from the OKX wallet (chrome plugin), and get the active address.
 */
export const useOkxWallet = () => {
  const { bitcoinAccount, setBitcoinAccount, bitcoinProvider, setBitcoinProvider } = useContext(WalletContext);
  const okxwallet = isMainnetNetworkInUse() ? window.okxwallet?.bitcoin : window.okxwallet?.bitcoinTestnet;

  useEffect(() => {
    if (!okxwallet)
      return;

    const accountChangedHandler = (_accounts: Array<string>) => {
      console.log("accounts changed", _accounts);
      setBitcoinAccount(_accounts?.[0]);
      setBitcoinProvider("okx");
    }

    okxwallet.on('accountsChanged', accountChangedHandler);

    if (bitcoinProvider === "okx") {
      okxwallet.getAccounts().then((_accounts: Array<string>) => {
        setBitcoinAccount(_accounts?.[0]);
        setBitcoinProvider("okx");
      });
    }

    return () => {
      okxwallet.removeListener('accountsChanged', accountChangedHandler);
    }
  }, [setBitcoinAccount, bitcoinProvider, setBitcoinProvider, okxwallet]);

  const connectWallet = useCallback(async (): Promise<boolean> => {
    console.log("Trying to connect OKX wallet");

    try {
      // If OKX wallet is already connected but we fakely "disconnect from bitcoin" earlier, requestAccounts()
      // does not trigger the accounts changed event. We directly get accounts in this case.
      let _accounts: string[] = await okxwallet.getAccounts();
      if (_accounts?.length <= 0)
        _accounts = await window.okxwallet?.bitcoin.requestAccounts();

      setBitcoinAccount(_accounts?.[0]);
      setBitcoinProvider("okx");

      return !!_accounts?.[0];
    }
    catch (e) {
      console.warn("OKX wallet connection error", e);
      return false;
    }
  }, [okxwallet, setBitcoinAccount, setBitcoinProvider]);

  const disconnectWallet = useCallback(async () => {
    try {
      // NOTE: no way to really disconnect from OKX wallet plugin for now
      setBitcoinAccount(undefined);
      setBitcoinProvider(undefined);
    }
    catch (e) {
      console.warn("OKX wallet disconnection error", e);
    }
  }, [setBitcoinAccount, setBitcoinProvider]);

  return {
    connectWallet,
    disconnectWallet,
    account: bitcoinAccount
  }
}