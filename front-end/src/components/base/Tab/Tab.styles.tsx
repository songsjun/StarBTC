import { ToggleButton, ToggleButtonGroup, styled } from "@mui/material";

import { TEXT_INVERTED_COLOR, TEXT_PRIMARY_COLOR } from "../../../constants";

export const StyledToggleButtonGroup = styled(ToggleButtonGroup)(
  ({ theme }) => ({
    height: "42px",
    borderRadius: "8px",
    outline: "2px solid rgba(190, 194, 218, 0.30)",
    [theme.breakpoints.down("sm")]: {
      height: "34px",
    },
  })
);

export const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  color: "rgba(190, 194, 218, 0.65)",
  backgroundColor: "inherit",
  padding: "2px 22px",
  border: 0,
  textTransform: "none",

  ":hover": {
    color: "rgba(190, 194, 218, 0.65)",
    backgroundColor: "inherit",
  },

  "&.Mui-selected": {
    color: TEXT_INVERTED_COLOR,
    backgroundColor: TEXT_PRIMARY_COLOR,
    borderRadius: "8px",
    ":hover": {
      backgroundColor: TEXT_PRIMARY_COLOR,
    },
  },

  [theme.breakpoints.down("sm")]: {
    fontSize: "12px",
    padding: "2px 18px",
  },
}));
