import { Typography, styled } from "@mui/material";

import { TEXT_PRIMARY_COLOR, TEXT_SECONDARY_COLOR } from "../../constants";

export const TableTitleWrapper = styled("div")({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  //marginBottom: 20
});

export const TradedAmountValue = styled(Typography)({
  color: TEXT_PRIMARY_COLOR,
  fontSize: "18px",
});

export const TradedAmountSymbol = styled(Typography)({
  color: TEXT_SECONDARY_COLOR,
  fontSize: "14px",
});

export const TableTitle = styled(Typography)({
  color: TEXT_SECONDARY_COLOR,
  fontSize: "20px",
  fontWeight: 700,
  lineHeight: "160%",
  letterSpacing: "0.15px",
});
