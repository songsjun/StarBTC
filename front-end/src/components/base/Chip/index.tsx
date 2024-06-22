import { Chip as RawChip, styled } from "@mui/material";

import { TEXT_INVERTED_COLOR } from "../../../constants";

export const Chip = styled(RawChip)(({ theme }) => ({
  display: "flex",
  padding: "3px 6px",
  flexDirection: "column",
  alignItems: "flex-start",
  borderRadius: "20px",
  background: "#4A4E64",
  width: "fit-content",
  color: TEXT_INVERTED_COLOR,
  fontSize: "14px",
  fontWeight: 500,
  lineHeight: "18px",
  letterSpacing: "0.16px",
  [theme.breakpoints.down("sm")]: {
    fontSize: "10px",
    padding: "0px 0px",
  },
}));
