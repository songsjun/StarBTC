import { TokenIcon } from "@components/base/Icon";
import { Stack, Typography } from "@mui/material";
import { TokenOrNative } from "@services/tokens/token-or-native";
import { FC } from "react";

export const TokenIconAndSymbol: FC<{
  token: TokenOrNative;
  selected?: boolean;
  margin?: number;
}> = ({ token, margin = 5 }) => {

  if (!token)
    return null;

  return (
    <Stack direction="row" alignItems="center">
      <TokenIcon token={token} style={{ height: 20, marginRight: margin }} />
      <Typography>{token.symbol}</Typography>
    </Stack>
  )
}