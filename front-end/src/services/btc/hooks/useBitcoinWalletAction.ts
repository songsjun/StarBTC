import { WalletContext } from "@contexts/WalletContext";
import { publishBitcoinTransaction } from "@services/blockstream-api/blockstream-api";
import { isMainnetNetworkInUse } from "@services/network/network";
import BigNumber from "bignumber.js";
import { useCallback, useContext } from "react";

/**
 * Commands sent to the active bitcoin wallet.
 */
export const useBitcoinWalletAction = () => {
  const { bitcoinProvider, setBitcoinAccount, setBitcoinProvider } = useContext(WalletContext);
  const okxwallet = isMainnetNetworkInUse() ? window.okxwallet?.bitcoin : window.okxwallet?.bitcoinTestnet;

  const getProvider = useCallback(() => {
    switch (bitcoinProvider) {
      case "unisat":
        return window.unisat;
      case "okx":
        return okxwallet;
    }
  }, [bitcoinProvider, okxwallet]);

  const canSignData = useCallback(() => {
    const provider = getProvider();
    return provider && "signData" in getProvider();
  }, [getProvider]);

  const sendBitcoin = useCallback(async (payAddress: string, satsToPay: number, satsPerVB: number): Promise<string> => {
    // Make sure to round to a integer fee
    const roundedSats = new BigNumber(satsPerVB).decimalPlaces(0).toNumber();

    switch (bitcoinProvider) {
      case "unisat":
        return window.unisat.sendBitcoin(payAddress, satsToPay, { feeRate: roundedSats });
      case "okx":
        return okxwallet.sendBitcoin(payAddress, satsToPay, { feeRate: roundedSats });
    }
  }, [bitcoinProvider, okxwallet]);

  const disconnectWallet = useCallback(() => {
    setBitcoinAccount(undefined);
    setBitcoinProvider(undefined);
  }, [setBitcoinAccount, setBitcoinProvider]);

  const getPublicKey = useCallback(() => {
    switch (bitcoinProvider) {
      case "unisat":
        return window.unisat.getPublicKey();
      case "okx":
        return okxwallet.getPublicKey();
    }
  }, [bitcoinProvider, okxwallet]);

  const signScriptData = useCallback((rawTxData: string) => {
    if (!canSignData())
      throw new Error("signScriptData(): this method is only supported by Essentials or Unisat wallets");

    const bitcoinProvider = window.unisat as SignDataBitcoinProvider;
    return bitcoinProvider.signData(rawTxData, "ecdsa");
  }, [canSignData]);

  // TODO: move this method outside of this wallet hook as we don't use the wallet any more.
  const publishTransaction = useCallback((rawtx: string): Promise<string> => {
    console.log("Publishing signed bitcoin transaction through third party API:", rawtx);
    return publishBitcoinTransaction(rawtx);
  }, []);

  return {
    getProvider,
    canSignData,
    /**
     * Initiates BTC sending (sign, publish). Returns the txid.
     */
    sendBitcoin,
    /**
     * Forgets current bitcoin account / provider in the app.
     */
    disconnectWallet,
    /**
     * Gets the public key of the active bitcoin account/address
     */
    getPublicKey,
    /**
     * Requests the bitcoin wallet to sign a transaction HASH (not raw transaction) using signData(). Not all wallets support this (Unisat, Essentials can).
     * The hash is different according to different use cases, for example obtained through hashForWitnessV0().
     */
    signScriptData,
    /**
     * Publishes a fully ready (signed) transaction through the bitcoin wallet.
     */
    publishTransaction
  }
}