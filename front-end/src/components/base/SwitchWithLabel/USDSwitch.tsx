import { FC } from "react";
import { useMediaQuery, useTheme } from "@mui/material";

import { SwitchWithLabel } from "./SwitchWithLabel";

export const USDSwitch: FC<{
  checked: boolean;
  onUSDSwitchChange: (value: boolean) => void;
}> = (props) => {
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.down("sm"));
  const { checked, onUSDSwitchChange } = props;
  return (
    <SwitchWithLabel
      label={matches ? "USD" : "USD Denominated"}
      checked={checked}
      onChange={onUSDSwitchChange}
    />
  );
};
