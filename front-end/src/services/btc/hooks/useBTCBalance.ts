import { WalletContext } from "@contexts/WalletContext";
import { getAddressInfo } from "@services/nownodes-api/nownodes-api";
import BigNumber from "bignumber.js";
import { useCallback, useContext, useEffect, useState } from "react";
import { satsToBtc } from "../btc";

/**
 * Returns the number of native coins owned by the active BTC address.
 * Readable format for display
 */
export const useBTCBalance = (decimals: number = 5) => {
  const { bitcoinAccount } = useContext(WalletContext);
  const [balance, setBalance] = useState<string>(undefined);

  const refreshBalance = useCallback(() => {
    if (!bitcoinAccount) {
      setBalance(undefined);
      return;
    }

    getAddressInfo(bitcoinAccount).then((info) => {
      const btcBalance = satsToBtc(new BigNumber(info.balance)).toFixed(decimals);
      setBalance(btcBalance);
    }).catch(() => {
      setBalance(undefined);
    });
  }, [bitcoinAccount, decimals]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  return { balance, refreshBalance };
}