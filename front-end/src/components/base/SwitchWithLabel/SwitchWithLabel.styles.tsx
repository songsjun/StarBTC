import { Typography, styled } from "@mui/material";

import { TEXT_SECONDARY_COLOR } from "../../../constants";

export const LabelText = styled(Typography)(({ theme }) => ({
  color: TEXT_SECONDARY_COLOR,
  fontSize: "16px",
  fontStyle: "normal",
  fontWeight: 500,
  lineHeight: "160%",
  letterSpacing: "0.15px",
  [theme.breakpoints.down("sm")]: {
    fontSize: "12px",
  },
}));
