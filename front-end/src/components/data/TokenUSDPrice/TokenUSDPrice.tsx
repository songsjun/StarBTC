import { TokenIcon } from "@components/base/Icon";
import { Stack } from "@mui/material";
import { useCoinPrice } from "@services/pricing/hooks/useCoinPrice";
import { TokenOrNative } from "@services/tokens/token-or-native";
import { formatUSD } from "@utils/formatNumber";
import { FC } from "react";

/**
 * Shows a token icon + it's current USD market value.
 */
export const TokenUSDPrice: FC<{
  token: TokenOrNative;
  color?: string;
}> = ({ token, color = "#fff" }) => {
  const usdPrice = useCoinPrice(token.symbol);

  return (
    <Stack alignItems="center" direction="row" style={{ color }}>
      <TokenIcon style={{ marginRight: "6px", height: 20, }} token={token} />
      {formatUSD(usdPrice)}
    </Stack>
  )
}