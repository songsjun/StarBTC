import { Typography, alpha, styled } from "@mui/material";
import { BACKGROUND_SECONDARY_COLOR, TEXT_PRIMARY_COLOR } from "src/constants";

export const WarningRoot = styled("div")({
  cursor: "pointer",
  borderRadius: 10,
  border: "solid 1px " + alpha(BACKGROUND_SECONDARY_COLOR, 0.5),
  padding: "2px 10px",
  transition: "all 0.2s ease",
  "&:hover": {
    background: alpha(TEXT_PRIMARY_COLOR, 0.1),
    borderColor: BACKGROUND_SECONDARY_COLOR
  }
});

export const WarningTitle = styled(Typography)({
  fontSize: "12px",
});


export const ContinueLink = styled(Typography)({
  fontWeight: 600,
  fontSize: "12px",
  color: BACKGROUND_SECONDARY_COLOR
});
