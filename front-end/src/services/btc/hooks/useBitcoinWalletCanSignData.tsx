import { WalletContext } from "@contexts/WalletContext";
import { useContext, useMemo } from "react";
import { useBitcoinWalletAction } from "./useBitcoinWalletAction";

/**
 * Tells if the currently active bitcoin wallet is a SignDataBitcoinProvider, meaning
 * that it has a signData() implementation to sign arbitrary bitcoin transactions.
 */
export const useBitcoinWalletCanSignData = (): boolean => {
  const { bitcoinProvider } = useContext(WalletContext);
  const { canSignData } = useBitcoinWalletAction();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => canSignData(), [bitcoinProvider]); // keep bitcoinProvider dep
}