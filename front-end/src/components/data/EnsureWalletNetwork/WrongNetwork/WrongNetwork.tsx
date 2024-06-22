import { Button, useMediaQuery, useTheme } from "@mui/material";
import { useEVMWallet } from "@services/evm/hooks/useEVMWallet";
import { formatAddress } from "@utils/formatAddress";

export const WrongNetwork = () => {
  const { account, handleConnect } = useEVMWallet();
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.down("md"));

  if (!account) return null;
  return (
    <Button
      onClick={handleConnect}
      size={"small"}
      variant="contained"
      sx={{
        fontSize: { sm: "16px", xs: "10px" },
      }}
    >
      Wrong Network {matches ? "" : formatAddress(account, [5, 4])}
    </Button>
  );
};
