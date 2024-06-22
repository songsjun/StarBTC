import { useErrorHandler } from "@contexts/ErrorHandlerContext";
import { useActiveEVMChainConfig } from "@services/chains/hooks/useActiveEVMChainConfig";
import { stdToEthersBigNumber } from "@services/evm/bignumbers";
import { useWeb3Utility } from "@services/evm/hooks/useWeb3Utility";
import { LoanOrder } from "@services/orders/model/loan-order";
import { TokenOrNative } from "@services/tokens/token-or-native";
import { tokenToContractValue } from "@services/tokens/tokens";
import { PopulatedTransaction } from "ethers";
import { useCallback } from "react";
import { useOrderData } from "../order-contract/useOrderData";
import { bitcoinAddressToZKPType } from "../zkp";
import { useActiveChainOrderFactoryContractInstance } from "./useOrderFactoryContractInstance";

/**
 * Methods to access the order factory contract (loan contract)
 */
export const useOrderFactoryContract = () => {
  const { submitTransaction } = useWeb3Utility();
  const { handleError } = useErrorHandler();
  const rwContractInstance = useActiveChainOrderFactoryContractInstance();
  const { fetchOrderData } = useOrderData();
  const activeChain = useActiveEVMChainConfig(false);

  const runAndHandle = useCallback(async <T>(handler: () => Promise<T>, userFeeback = true): Promise<T> => {
    return new Promise(resolve => {
      handler().then(res => resolve(res)).catch(e => {
        userFeeback && handleError(e);
        resolve(null);
      })
    });
  }, [handleError]);

  const submitOrderCreation = useCallback(async (eventName: "OrderCreated", tx: PopulatedTransaction): Promise<LoanOrder> => {
    const orderCreatedEvent = new Promise<LoanOrder>(resolve => {
      rwContractInstance.on(eventName, async (orderId: string) => {
        console.log("Order ID:", orderId);

        const data = await fetchOrderData(orderId);
        const createdOrder = await LoanOrder.fromOrderData(data, activeChain);

        // Only handle our own created order, not others' by mistake
        if (createdOrder.lender.evmAddress === tx.from)
          resolve(createdOrder);
      })
    });

    if (await submitTransaction(tx, true)) {
      // Await order creation event
      return orderCreatedEvent;
    }

    return null;
  }, [submitTransaction, rwContractInstance, fetchOrderData, activeChain]);

  /**
   * @param lendingAmount human readable token amount
   */
  const createLendingOrder = useCallback(async (token: TokenOrNative, lendingAmount: string, lendingDays: number, lenderBitcoinAddress: string, lenderBTCPublicKey: string, btcTransferConfirmationTip: number): Promise<LoanOrder> => {
    return runAndHandle(async () => {
      console.log("Starting to create a new lending order", "Amount:", lendingAmount, "Days:", lendingDays, "BTC Public key:", lenderBTCPublicKey, "Tip:", btcTransferConfirmationTip);

      const contractLendingAmount = tokenToContractValue(lendingAmount, token.decimals);
      const contractTipAmount = tokenToContractValue(btcTransferConfirmationTip, token.decimals);

      console.log("Calling factory contract createLendingOrder() with arguments:", token.contractAddress, stdToEthersBigNumber(contractLendingAmount).toString(), lendingDays, bitcoinAddressToZKPType(lenderBitcoinAddress), `0x${lenderBTCPublicKey}`)

      const tx = await rwContractInstance.populateTransaction.createLendingOrder(
        token.contractAddress,
        stdToEthersBigNumber(contractLendingAmount),
        lendingDays,
        bitcoinAddressToZKPType(lenderBitcoinAddress),
        `0x${lenderBTCPublicKey}`,
        stdToEthersBigNumber(contractTipAmount)
      );

      return submitOrderCreation("OrderCreated", tx);
    });
  }, [runAndHandle, rwContractInstance, submitOrderCreation]);

  return {
    /**
     * Creates a new lending order, meaning that the creator provides USDT/tokens for lenders.
     */
    createLendingOrder
  }
}
