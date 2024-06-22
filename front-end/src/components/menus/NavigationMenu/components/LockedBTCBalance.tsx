import LockerIcon from "@assets/locker.svg";
import BTCIcon from "@assets/tokens/btc.svg";
import { Stack, Typography } from "@mui/material";
import { useLockedBTC } from "@services/btc/hooks/useLockedBTC";
import { formatNumber } from "@utils/formatNumber";
import { FC } from "react";

export const LockedBTCBalance: FC = () => {
  const { lockedBTCAmount } = useLockedBTC();

  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <Stack direction="row" alignItems="center" style={{ position: "relative" }}>
        <img src={BTCIcon} style={{ height: 20, opacity: 1 }} />
        <img src={LockerIcon} style={{ height: 12, position: "absolute", left: -16 }} />
      </Stack>
      <Typography>{lockedBTCAmount === undefined ? "..." : formatNumber(lockedBTCAmount, { decimal: 6 })}</Typography>
    </Stack>
  )
}