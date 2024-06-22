import { WalletContext } from "@contexts/WalletContext";
import { useContext, useMemo } from "react";

/**
 * Tells if the given BTC address is supported by the app.
 */
export const useBitcoinAddressSupported = (address: string) => {
  const { networkMode } = useContext(WalletContext);

  return useMemo(() => {
    // Restrict to what Essentials supports (Everything but P2SH)
    if (networkMode === "mainnet") {
      // mainnet
      return (address?.startsWith("1") || address?.startsWith("bc"))
    }
    else {
      // testnet
      return (address?.startsWith("m") || address?.startsWith("n") || address?.startsWith("tb"))
    }
  }, [address, networkMode]);
}