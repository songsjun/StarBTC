import { ExpandMore } from "@mui/icons-material";
import { MenuItem, Typography, styled } from "@mui/material";

import {
  TEXT_PRIMARY_COLOR,
  TEXT_SECONDARY_COLOR,
} from "../../../../../constants";

export const AccountAddress = styled(Typography)(({ theme }) => ({
  fontSize: "18px",
  lineHeight: "150%",
  color: TEXT_PRIMARY_COLOR,
  [theme.breakpoints.down("sm")]: {
    fontSize: "14px",
  },
  ":hover": {
    cursor: "pointer",
  },
}));

export const ExpandMoreIcon = styled(ExpandMore)({
  marginLeft: "8px",
  color: TEXT_SECONDARY_COLOR,
  width: "24px",
  height: "24px",
});

export const MenuItemStyle = styled(MenuItem)``;

export const MenuItemText = styled("div")({
  textEdge: "cap",
  fontSize: "14px",
  lineHeight: "143%",
  letterSpacing: "0.17px",
  marginLeft: "14px",
});

export const TestnetLabel = styled(Typography)(() => ({
  fontSize: "11px",
  color: "#FF0000"
}));