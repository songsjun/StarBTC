import { useErrorHandler } from "@contexts/ErrorHandlerContext";
import { useActiveEVMChainConfig } from "@services/chains/hooks/useActiveEVMChainConfig";
import { etherToStdBigNumber, stdToEthersBigNumber } from "@services/evm/bignumbers";
import { useWeb3Utility } from "@services/evm/hooks/useWeb3Utility";
import { isMainnetNetworkInUse } from "@services/network/network";
import { ContractOrderVerificationStatus, LoanOrder } from "@services/orders/model/loan-order";
import { TokenOrNative } from "@services/tokens/token-or-native";
import { tokenToContractValue, tokenToReadableValue } from "@services/tokens/tokens";
import { sha256 } from "@utils/crypto/sha256";
import { useCallback } from "react";
import { ProofParams } from "../zkp-proofs";
import { useOrderContractInstance } from "./useOrderContractInstance";
import { useOrderData } from "./useOrderData";

/**
 * Methods to access an order contract based on its address.
 * Note that every order has its own contract.
 */
export const useOrderContract = (order: LoanOrder) => {
  const { submitTransaction } = useWeb3Utility();
  const { handleError } = useErrorHandler();
  const { getActiveChainInstance, getReadOnlyInstance } = useOrderContractInstance();
  const { fetchOrderData } = useOrderData();
  const activeChain = useActiveEVMChainConfig();

  const runAndHandle = useCallback(async <T>(handler: () => Promise<T>, userFeeback = true): Promise<T> => {
    return new Promise(resolve => {
      handler().then(res => resolve(res)).catch(e => {
        userFeeback && handleError(e);
        resolve(null);
      })
    });
  }, [handleError]);

  const refreshOrder = useCallback(async () => {
    try {
      const orderData = await fetchOrderData(order.id);
      order.updateWithOrderData(orderData, activeChain);
      return true;
    }
    catch (e) {
      console.error("Failed to refresh order data", e);
      return false;
    }
  }, [activeChain, fetchOrderData, order]);

  const takeOrder = useCallback(async (token: TokenOrNative, takerBtcAddress: string, takerPublicKey: string, preImageHash: string, tipAmountToLender: number) => {
    return runAndHandle(async () => {
      const contractTipAmount = tokenToContractValue(tipAmountToLender, token.decimals);

      const tx = await getActiveChainInstance(order.id).populateTransaction.takeOrder(
        takerBtcAddress,
        `0x${takerPublicKey}`,
        `0x${preImageHash}`,
        isMainnetNetworkInUse() ? "mainnet" : "testnet",
        stdToEthersBigNumber(contractTipAmount)
      );
      await submitTransaction(tx, true);
      return true;
    });
  }, [submitTransaction, runAndHandle, order, getActiveChainInstance]);

  const submitToLenderTransferProof = useCallback(async (order: LoanOrder, proofParams: ProofParams): Promise<boolean> => {
    return runAndHandle(async () => {
      if (!proofParams)
        throw new Error("submitToLenderTransferProof() error: Proof parameters are not set, make sure the BTC transaction has been mined");

      const { txRawData, utxos, proof, merkleRoot, blockHeight, leaf, positions } = proofParams;

      const tx = await getActiveChainInstance(order.id).populateTransaction.submitToLenderTransferProof(
        txRawData,
        utxos,
        blockHeight,
        {
          proof,
          root: merkleRoot,
          leaf,
          flags: positions
        }
      );
      await submitTransaction(tx, true);

      return true;
    });
  }, [getActiveChainInstance, runAndHandle, submitTransaction]);

  const submitRegularUnlockTransferProof = useCallback(async (order: LoanOrder, proofParams: ProofParams): Promise<boolean> => {
    return runAndHandle(async () => {
      if (!proofParams)
        throw new Error("submitRegularUnlockTransferProof() error: Proof parameters are not set, make sure the BTC transaction has been mined");

      const { txRawData, utxos, proof, merkleRoot, blockHeight, leaf, positions } = proofParams;

      const tx = await getActiveChainInstance(order.id).populateTransaction.submitRegularUnlockTransferProof(
        txRawData,
        utxos,
        blockHeight,
        {
          proof,
          root: merkleRoot,
          leaf,
          flags: positions
        }
      );
      await submitTransaction(tx, true);

      return true;
    });
  }, [getActiveChainInstance, runAndHandle, submitTransaction]);

  const borrow = useCallback(async (preImage: string) => {
    return runAndHandle(async () => {
      const preImageHash = sha256(Buffer.from(preImage, "hex")).toString("hex") // Debug purpose
      console.log("Borrowing tokens, preImage:", preImage, "param:", `0x${preImage}`, "hash:", preImageHash);
      const tx = await getActiveChainInstance(order.id).populateTransaction.borrow(`0x${preImage}`);
      await submitTransaction(tx, true);
      return true;
    });
  }, [submitTransaction, runAndHandle, order, getActiveChainInstance]);

  // NOTE: in order to repay, the borrower needs to sign a unlock BTC transaction and send it to this method.
  const borrowerRepayment = useCallback(async (btcRawData: string, borrowerSignature: string) => {
    return runAndHandle(async () => {
      console.log("btcRawData", btcRawData)
      console.log("borrowerSignature", borrowerSignature)
      const tx = await getActiveChainInstance(order.id).populateTransaction.repay(
        `0x${btcRawData}`,
        `0x${borrowerSignature}`
      );
      await submitTransaction(tx, true);
      return true;
    });
  }, [submitTransaction, runAndHandle, order, getActiveChainInstance]);

  const closeOrder = useCallback(async () => {
    return runAndHandle(async () => {
      const tx = await getActiveChainInstance(order.id).populateTransaction.closeOrder();
      await submitTransaction(tx, true);
      return true;
    });
  }, [submitTransaction, runAndHandle, order, getActiveChainInstance]);

  const getLoanScript = useCallback(async (): Promise<string> => {
    return runAndHandle(async () => {
      const script = await getReadOnlyInstance(order.id).loanScript();
      return script.slice(2); // remove 0x prefix
    });
  }, [runAndHandle, order, getReadOnlyInstance]);

  const getToLenderTransferZkpStatus = useCallback(async (): Promise<ContractOrderVerificationStatus> => {
    try {
      const status = await getReadOnlyInstance(order.id).getToLenderTransferZkpStatus();
      return status;
    }
    catch (e) {
      // Silent catch, no toast
      console.warn("getToLenderTransferZkpStatus() failure", e);
      return undefined;
    }
  }, [order, getReadOnlyInstance]);

  const getRegularUnlockTransferZkpStatus = useCallback(async (): Promise<ContractOrderVerificationStatus> => {
    try {
      const status = await getReadOnlyInstance(order.id).getRegularUnlockTransferZkpStatus();
      return status;
    }
    catch (e) {
      // Silent catch, no toast
      console.warn("getRegularUnlockTransferZkpStatus() failure", e);
      return undefined;
    }
  }, [order, getReadOnlyInstance]);

  const confirmRegularUnlockTransfer = useCallback(async (wTxId: string, txId: string) => {
    return runAndHandle(async () => {
      const tx = await getActiveChainInstance(order.id).populateTransaction.confirmRegularUnlockTransfer(
        `0x${wTxId}`,
        `0x${txId}`
      );
      await submitTransaction(tx, true);
      return true;
    });
  }, [submitTransaction, runAndHandle, order, getActiveChainInstance]);

  const confirmTransferToLender = useCallback(async (wTxId: string, txId: string) => {
    return runAndHandle(async () => {
      const tx = await getActiveChainInstance(order.id).populateTransaction.confirmTransferToLender(
        `0x${wTxId}`,
        `0x${txId}`
      );
      await submitTransaction(tx, true);
      return true;
    });
  }, [submitTransaction, runAndHandle, order, getActiveChainInstance]);

  const requestArbitration = useCallback(async (btcRawData: string, borrowerSignature: string) => {
    return runAndHandle(async () => {
      console.log("btcRawData", btcRawData)
      console.log("borrowerSignature", borrowerSignature)
      const tx = await getActiveChainInstance(order.id).populateTransaction.requestArbitration(
        `0x${btcRawData}`,
        `0x${borrowerSignature}`
      );
      await submitTransaction(tx, true);
      return true;
    });
  }, [submitTransaction, runAndHandle, order, getActiveChainInstance]);

  const getArbitrationCost = useCallback(async (): Promise<number> => {
    try {
      const cost = await getReadOnlyInstance(order.id).getArbitrationRequestCost();
      console.log("cost", cost, order.token.decimals)
      return tokenToReadableValue(etherToStdBigNumber(cost), order.token.decimals).toNumber();
    }
    catch (e) {
      // Silent catch, no toast
      console.warn("getArbitrationCost() failure", e);
      return undefined;
    }
  }, [order, getReadOnlyInstance]);

  return {
    refreshOrder,
    takeOrder,
    submitToLenderTransferProof,
    submitRegularUnlockTransferProof,
    borrow,
    borrowerRepayment,
    /**
     * Closes the order, making it finalized and not usable forever. This method can be called by different
     * parties (borrower, lender) and while in different states (created, taken, repaid...) but the outcome depends on 
     * many criteria checked by the contract.
     */
    closeOrder,
    getLoanScript,
    /**
     * Tells whether the borrower's BTC transaction (sent to the lock script) has been ZKP verified or not.
     */
    getToLenderTransferZkpStatus,
    getRegularUnlockTransferZkpStatus,
    confirmRegularUnlockTransfer,
    confirmTransferToLender,
    requestArbitration,
    /**
     * Returns the cost for requesting an arbitrage. The value is a number of tokens (eg: USDT)
     * in readable format.
     */
    getArbitrationCost
  }
}
