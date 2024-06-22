import { TokenIcon } from "@components/base/Icon";
import { Stack, Typography } from "@mui/material";
import { useBTCBalance } from "@services/btc/hooks/useBTCBalance";
import { useActiveEVMChainConfig } from "@services/chains/hooks/useActiveEVMChainConfig";
import { getTokenBySymbol } from "@services/tokens/tokens";
import { formatNumber } from "@utils/formatNumber";
import { FC } from "react";
import { useInterval } from "react-use";

export const BTCBalance: FC = () => {
  const activeChain = useActiveEVMChainConfig();
  const btcToken = getTokenBySymbol(activeChain, "BTC");
  const { balance, refreshBalance } = useBTCBalance();
  useInterval(refreshBalance, 10000); // Refresh balance every 10 seconds

  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <TokenIcon token={btcToken} style={{ height: 20 }} />
      <Typography>{balance === undefined ? "..." : formatNumber(balance, { decimal: 6 })}</Typography>
    </Stack>
  )
}