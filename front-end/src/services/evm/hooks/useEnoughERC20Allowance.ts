import { WalletContext } from "@contexts/WalletContext";
import BigNumber from "bignumber.js";
import { useCallback, useContext, useEffect, useState } from "react";
import { useERC20Contract } from "./useERC20Contract";

/**
 * Hooks that automatically refresh the allowance status for a given token/spender/amount.
 */
export const useEnoughERC20Allowance = (contractAddress: string, spender: string, amount: BigNumber | number) => {
  const { evmAccount } = useContext(WalletContext);
  const [enoughAllowance, setEnoughAllowance] = useState<boolean>(undefined);
  const [allowance, setAllowance] = useState<BigNumber>(undefined);
  const { getAllowance } = useERC20Contract(contractAddress);

  const refreshAllowance = useCallback(() => {
    if (evmAccount && contractAddress && spender && amount) {
      setAllowance(undefined);
      setEnoughAllowance(undefined);
      getAllowance(evmAccount, spender).then(allowance => {
        setAllowance(allowance);
        if (!allowance)
          setEnoughAllowance(false);
        else
          setEnoughAllowance(allowance.gte(amount))
      });
    }
    else
      setEnoughAllowance(undefined);
  }, [getAllowance, amount, evmAccount, spender, contractAddress]);

  useEffect(() => {
    refreshAllowance();
  }, [refreshAllowance]);

  return {
    allowance, /** Human readable number of tokens */
    enoughAllowance,
    refreshAllowance
  };
}