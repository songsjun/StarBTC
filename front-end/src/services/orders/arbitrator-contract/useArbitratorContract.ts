import { useErrorHandler } from "@contexts/ErrorHandlerContext";
import { useCallback } from "react";
import { useArbitratorContractInstance } from "./useArbitratorContractInstance";

/**
 * Methods to access the arbitrator contract
 */
export const useArbitratorContract = () => {
  const { handleError } = useErrorHandler();
  const roContractInstance = useArbitratorContractInstance();

  const runAndHandle = useCallback(async <T>(handler: () => Promise<T>, userFeeback = true): Promise<T> => {
    return new Promise(resolve => {
      handler().then(res => resolve(res)).catch(e => {
        userFeeback && handleError(e);
        resolve(null);
      })
    });
  }, [handleError]);

  const getArbitratorPublicKey = useCallback(async (): Promise<string> => {
    return runAndHandle(async () => {
      const pubKey = await roContractInstance.getArbitratorPublicKey();
      return pubKey?.slice(2); // remove 0x prefix
    });
  }, [runAndHandle, roContractInstance]);

  return {
    getArbitratorPublicKey
  }
}
