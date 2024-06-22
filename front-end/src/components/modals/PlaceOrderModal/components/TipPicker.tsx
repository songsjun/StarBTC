import { TokenIconAndSymbol } from "@components/data/TokenIconAndSymbol/TokenIconAndSymbol";
import { FormControl, MenuItem, Select, SelectChangeEvent, Stack } from "@mui/material";
import { TokenOrNative } from "@services/tokens/token-or-native";
import { useScreenSize } from "@services/ui-ux/hooks/useScreenSize";
import { FC, useState } from "react";

export const TipPicker: FC<{
  defaultValue: number;
  availableValues: number[];
  token: TokenOrNative;
  onValueSelected: (value: number) => void;
}> = ({ defaultValue, availableValues, token, onValueSelected }) => {
  const { isSmScreen } = useScreenSize();
  const [selectedValue, setSelectedValue] = useState<string>(`${defaultValue}`);

  const handleValueChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setSelectedValue(value);
    onValueSelected(parseInt(value));
  }

  if (!token)
    return null;

  return (
    <FormControl sx={{ m: !isSmScreen ? 1 : 0, marginTop: !isSmScreen ? 1 : 2, minWidth: 100, height: "100%", margin: 0, mt: "2px" }} size="small">
      <Select displayEmpty value={selectedValue} onChange={handleValueChange} sx={{ height: 56 }} renderValue={(selected) => {
        return <TokenWithValue value={parseInt(selected)} token={token} />
      }}>
        {
          availableValues?.map((value, i) =>
            <MenuItem value={value} key={i}>
              <TokenWithValue value={value} token={token} />
            </MenuItem>
          )
        }
      </Select>
    </FormControl>
  )
}

const TokenWithValue: FC<{
  value: number;
  token: TokenOrNative;
}> = ({ value, token }) => {
  return <Stack direction="row" gap={1} alignItems="center" alignContent="center">
    <div style={{ width: 15, textAlign: "right" }}>{value}</div>
    <TokenIconAndSymbol token={token} />
  </Stack>
}
