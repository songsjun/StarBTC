import { FormControl, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { useScreenSize } from "@services/ui-ux/hooks/useScreenSize";
import { FC, useState } from "react";

export const DurationPicker: FC<{
  defaultValue: number;
  availableValues: number[];
  onDurationSelected: (value: number) => void;
}> = ({ defaultValue, availableValues, onDurationSelected }) => {
  const { isXsScreen } = useScreenSize();
  const [selectedValue, setSelectedValue] = useState<string>(`${defaultValue}`);

  const handleValueChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setSelectedValue(value);
    onDurationSelected(parseInt(value));
  }

  return (
    <FormControl sx={{ m: !isXsScreen ? 1 : 0, marginTop: !isXsScreen ? 1 : 2, minWidth: 100, height: "100%", margin: 0, mt: "2px" }} size="small">
      <Select displayEmpty value={selectedValue} onChange={handleValueChange} sx={{ height: 56 }}>
        {
          availableValues.map((value, i) =>
            <MenuItem value={value} key={i}>{value} days</MenuItem>
          )
        }
      </Select>
    </FormControl>
  )
}

