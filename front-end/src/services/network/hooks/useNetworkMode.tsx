import { WalletContext } from "@contexts/WalletContext";
import { useContext } from "react";

export const useNetworkMode = () => {
  const { networkMode } = useContext(WalletContext);

  return {
    isMainnet: networkMode === "mainnet"
  }
}