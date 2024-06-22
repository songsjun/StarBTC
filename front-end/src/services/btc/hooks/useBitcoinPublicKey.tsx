import { WalletContext } from "@contexts/WalletContext";
import { useContext, useEffect, useState } from "react";
import { useBitcoinWalletAction } from "./useBitcoinWalletAction";

/**
 * Returns the public key of the currently active bitcoin account.
 */
export const useBitcoinPublicKey = (): string => {
  const { bitcoinAccount } = useContext(WalletContext);
  const { getPublicKey } = useBitcoinWalletAction();
  const [publicKey, setPublicKey] = useState<string>(undefined);

  useEffect(() => {
    if (bitcoinAccount) {
      getPublicKey().then(key => setPublicKey(key)).catch(() => setPublicKey(undefined));
    }
    else {
      setPublicKey(undefined);
    }
  }, [bitcoinAccount, getPublicKey])

  return publicKey;
}