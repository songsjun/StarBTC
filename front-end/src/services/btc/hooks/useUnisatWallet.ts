import { WalletContext } from "@contexts/WalletContext";
import { useCallback, useContext, useEffect } from "react";

/**
 * Hook to connect/disconnect from the unisat wallet (chrome plugin), and get the active address.
 */
export const useUnisatWallet = () => {
  const { setBitcoinAccount, bitcoinProvider, setBitcoinProvider } = useContext(WalletContext);

  useEffect(() => {
    if (!window.unisat)
      return;

    const accountChangedHandler = (_accounts: Array<string>) => {
      console.log("accounts changed", _accounts);
      setBitcoinAccount(_accounts?.[0]);
      setBitcoinProvider("unisat");
    }

    window.unisat.on('accountsChanged', accountChangedHandler);

    if (bitcoinProvider === "unisat") {
      window.unisat.getAccounts().then((_accounts: Array<string>) => {
        setBitcoinAccount(_accounts?.[0]);
        setBitcoinProvider("unisat");
      });
    }

    return () => {
      window.unisat.removeListener('accountsChanged', accountChangedHandler);
    }
  }, [setBitcoinAccount, bitcoinProvider, setBitcoinProvider]);

  const connectWallet = useCallback(async (): Promise<boolean> => {
    try {
      // If unisat is already connected but we fakely "disconnect from bitcoin" earlier, requestAccounts()
      // does not trigger the accounts changed event. We directly get accounts in this case.
      let _accounts: string[] = await window.unisat.getAccounts();
      if (_accounts?.length <= 0)
        _accounts = await window.unisat.requestAccounts();

      setBitcoinAccount(_accounts?.[0]);
      setBitcoinProvider("unisat");

      return !!_accounts?.[0];
    }
    catch (e) {
      console.warn("Unisat connection error", e);
      return false;
    }
  }, [setBitcoinAccount, setBitcoinProvider]);

  const disconnectWallet = useCallback(async () => {
    try {
      // NOTE: no way to really disconnect from unisat plugin fo rnow
      setBitcoinAccount(undefined);
      setBitcoinProvider(undefined);
    }
    catch (e) {
      console.warn("Unisat disconnection error", e);
    }
  }, [setBitcoinAccount, setBitcoinProvider]);

  return {
    connectWallet,
    disconnectWallet
  }
}