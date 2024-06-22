import { TokenOrNative } from "@services/tokens/token-or-native";
import BigNumber from "bignumber.js";
import { useEffect, useState } from "react";
import { InterestInfo, useInterestContract } from "../interest-contract/useInterestContract";

export const useInterestInfo = (lendingAmount: number, token: TokenOrNative, lendingDays: number): InterestInfo => {
  const { computeInterests } = useInterestContract();
  const [info, setInfo] = useState<InterestInfo>(undefined);

  useEffect(() => {
    if (lendingAmount === undefined || token === undefined || lendingDays === undefined) {
      setInfo(undefined);
      return;
    }

    // Special debug case where 0 duration is allowed to get short timelocks
    if (lendingDays === 0) {
      setInfo({ interestAmount: new BigNumber(0), interestRate: new BigNumber(0) });
      return
    }

    setInfo(undefined);
    computeInterests(lendingAmount, token, lendingDays).then(setInfo);
  }, [lendingAmount, token, lendingDays, computeInterests]);

  return info;
}