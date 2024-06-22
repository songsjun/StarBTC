import { TransactionRequest } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { SnackbarKey, useSnackbar } from "notistack";
import { useCallback } from "react";
import Web3Token from "web3-token";

import { errorToast } from "@components/base/Toast/error";
import { successToast, waitForSignToast } from "../../../components/base/Toast";

export const useWeb3Utility = () => {
  const { provider } = useWeb3React();
  const { closeSnackbar } = useSnackbar();

  const submitTransaction = useCallback(async (transaction: TransactionRequest, waitForResult = false) => {
    if (!provider) {
      errorToast("No EVM provider, can't submit transaction!");
      return null;
    }

    let toastKey: SnackbarKey | undefined = undefined;
    try {
      const gasPrice = await provider.getGasPrice();
      const estimateGas = await provider.getSigner().estimateGas(transaction);
      const signer = provider?.getSigner();

      // Toast to let user know he should confirm the tx in his wallet
      toastKey = waitForSignToast();

      const transactionWithGas: TransactionRequest = {
        gasLimit: estimateGas,
        gasPrice,
        ...transaction,
      }

      let hash: string;
      if (waitForResult) {
        console.log("Sending transaction then waiting for result");

        // Publish tx then wait until it's processed by the blockchain
        const transactionResponse = await signer?.sendTransaction(transactionWithGas);
        console.log("Transaction sent");

        closeSnackbar(toastKey);

        // Wait until the transaction gets mined by one block (or fails)
        await transactionResponse?.wait(1);
        hash = transactionResponse.hash;
      }
      else {
        console.log("Sending transaction without waiting for result");

        // Publish tx but immediatelly return without knowing the result
        hash = await signer?.sendUncheckedTransaction(transactionWithGas);
        closeSnackbar(toastKey);
      }

      // Show success message
      toastKey = successToast();

      return { hash };
    } catch (e: any) {
      closeSnackbar(toastKey);
      throw e;
    }
  }, [closeSnackbar, provider]);

  const signForVerify = useCallback(async () => {
    if (!provider)
      return null;

    let finalBarKey: SnackbarKey | undefined = undefined;
    try {
      const signer = provider.getSigner();

      finalBarKey = waitForSignToast();

      const signature = await Web3Token.sign(
        async (msg: string) => await signer.signMessage(msg),
        {
          domain: "bel2.org",
          statement: "Unused for now",
          expires_in: "30 days",
        }
      );

      return signature;
    } catch (e) {
      closeSnackbar(finalBarKey);
      throw e;
    }
  }, [closeSnackbar, provider]);

  return {
    submitTransaction,
    signForVerify,
  };
};
