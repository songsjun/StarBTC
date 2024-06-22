import { useErrorHandler } from "@contexts/ErrorHandlerContext";
import { etherToStdBigNumber } from "@services/evm/bignumbers";
import { TokenOrNative } from "@services/tokens/token-or-native";
import { tokenToReadableValue } from "@services/tokens/tokens";
import BigNumber from "bignumber.js";
import { useCallback } from "react";
import { useInterestContractInstance } from "./useInterestContractInstance";

export type InterestInfo = {
  interestRate: BigNumber;
  interestAmount: BigNumber;
}

/**
 * Methods to access the interest contract that gives information about loan costs/interests to pay after taking loans.
 */
export const useInterestContract = () => {
  const { handleError } = useErrorHandler();
  const roContractInstance = useInterestContractInstance();

  const runAndHandle = useCallback(async <T>(handler: () => Promise<T>, userFeeback = true): Promise<T> => {
    return new Promise(resolve => {
      handler().then(res => resolve(res)).catch(e => {
        userFeeback && handleError(e);
        resolve(null);
      })
    });
  }, [handleError]);

  const computeInterests = useCallback(async (lendingAmount: number, token: TokenOrNative, lendingDays: number): Promise<InterestInfo> => {
    return runAndHandle(async () => {
      const contractInterestRate = await roContractInstance.GetInterestRate(lendingDays);
      const interestRate = tokenToReadableValue(etherToStdBigNumber(contractInterestRate), 18);
      const interestAmount = new BigNumber(lendingAmount).multipliedBy(interestRate);

      return {
        interestRate,
        interestAmount
      };
    });
  }, [runAndHandle, roContractInstance]);

  return {
    /**
     * @param amount Human readable lending amount
     */
    computeInterests
  }
}
