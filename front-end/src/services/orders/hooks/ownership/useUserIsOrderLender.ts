import { WalletContext } from "@contexts/WalletContext";
import { useContext } from "react";
import { LoanOrder } from "../../model/loan-order";

export const useUserIsOrderLender = (order: LoanOrder): boolean => {
  const { evmAccount } = useContext(WalletContext);
  return evmAccount === order.lender.evmAddress;
}