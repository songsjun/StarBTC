import { FC } from "react";
import { Stack, Switch, useMediaQuery, useTheme } from "@mui/material";

import { LabelText } from "./SwitchWithLabel.styles";

interface SwitchWithLabelProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const SwitchWithLabel: FC<SwitchWithLabelProps> = ({
  label,
  checked,
  onChange,
}) => {
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <Stack direction="row" sx={{ alignItems: "center", marginRight: "12px" }}>
      <Switch
        size={matches ? "small" : "medium"}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <LabelText>{label}</LabelText>
    </Stack>
  );
};
