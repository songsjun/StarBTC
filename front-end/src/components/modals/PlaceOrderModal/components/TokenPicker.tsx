import { TokenIconAndSymbol } from "@components/data/TokenIconAndSymbol/TokenIconAndSymbol";
import { FormControl, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { useActiveEVMChainConfig } from "@services/chains/hooks/useActiveEVMChainConfig";
import { TokenOrNative } from "@services/tokens/token-or-native";
import { useScreenSize } from "@services/ui-ux/hooks/useScreenSize";
import { FC, useState } from "react";

export const TokenPicker: FC<{
  defaultToken: TokenOrNative; // Token shown at first
  onTokenSelected: (token: TokenOrNative) => void;
}> = ({ defaultToken, onTokenSelected }) => {
  const { isXsScreen } = useScreenSize();
  const activeChain = useActiveEVMChainConfig();
  const [selectedToken, setSelectedToken] = useState<TokenOrNative>(defaultToken);
  const availableTokens = activeChain?.tokens;

  const handleTokenChange = (event: SelectChangeEvent<string>) => {
    const token = tokenFromSymbol(event.target.value);
    setSelectedToken(token);
    onTokenSelected(token);
  }

  const tokenFromSymbol = (symbol: string) => availableTokens?.find(t => t.symbol === symbol);

  return (
    <FormControl sx={{ m: !isXsScreen ? 1 : 0, marginTop: !isXsScreen ? 1 : 2, minWidth: 100, height: "100%", margin: 0, mt: "2px" }} size="small">
      <Select displayEmpty value={selectedToken?.symbol} onChange={handleTokenChange} sx={{ height: 56 }} renderValue={(selected) => {
        return <TokenIconAndSymbol token={tokenFromSymbol(selected)} selected />
      }}>
        {
          availableTokens?.filter(t => t.canPlaceOrders).map((token, i) =>
            <MenuItem value={token.symbol} key={i}>
              <TokenIconAndSymbol token={token} />
            </MenuItem>
          )
        }
      </Select>
    </FormControl>
  )
}

