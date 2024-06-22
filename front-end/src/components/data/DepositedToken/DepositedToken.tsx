import { TokenIcon } from "@components/base/Icon";
import { Stack } from "@mui/material";
import { TokenOrNative } from "@services/tokens/token-or-native";
import { formatNumber } from "@utils/formatNumber";
import BigNumber from "bignumber.js";
import { FC } from "react";

export const DepositedToken: FC<{
  amount: BigNumber | number;
  token: TokenOrNative;
  justifyContent?: string;
  decimals?: number;
  hideTokenLogo?: boolean;
}> = ({ amount, token, justifyContent = "center", decimals = 2, hideTokenLogo = false }) => {

  return (
    <Stack alignItems="center" justifyContent={justifyContent} direction="row">
      {!hideTokenLogo && <TokenIcon style={{ marginRight: "6px", height: 14 }} token={token} />}
      {formatNumber(amount, { decimal: decimals })}
      <span style={{ marginLeft: 5 }}>{token.symbol}</span>
    </Stack>
  )
}