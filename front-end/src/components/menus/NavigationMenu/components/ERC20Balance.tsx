import { TokenIcon } from "@components/base/Icon";
import { Stack, Typography } from "@mui/material";
import { useERC20Balance } from "@services/evm/hooks/useERC20Balance";
import { formatNumber } from "@utils/formatNumber";
import { FC } from "react";
import { useInterval } from "react-use";

export const ERC20Balance: FC<{
  symbol: string;
}> = ({ symbol }) => {
  const { displayBalance, refreshBalance, token } = useERC20Balance(symbol);
  useInterval(refreshBalance, 60000); // Refresh balance every 60 seconds

  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <TokenIcon token={token} style={{ height: 20 }} />
      <Typography>{displayBalance === undefined ? "..." : formatNumber(displayBalance, { decimal: 4 })}</Typography>
    </Stack>
  )
}