import { TokenOrNative } from "@services/tokens/token-or-native";
import { useMemo } from "react";
import * as yup from "yup";

export const useMarketOrderValidationSchema = (inToken: TokenOrNative) => {
  const minDeposit = inToken.minPlaceAmount;
  const minAmountError = `Positive amount above ${minDeposit} ${inToken.symbol.toUpperCase()} is needed`;

  const maxDeposit = inToken.maxPlaceAmount;
  const maxAmountError = `Positive amount below ${maxDeposit} ${inToken.symbol.toUpperCase()} is needed`;

  return useMemo(() => {
    return yup.object().shape({
      // NOTE: "max": temporary limit orders to be less than X tokens.
      deposited: yup.number()
        .positive(minAmountError)
        .min(minDeposit, minAmountError)
        .max(maxDeposit, maxAmountError)
        .required()
        .typeError(minAmountError),
    });
  }, [maxAmountError, maxDeposit, minAmountError, minDeposit]);
}