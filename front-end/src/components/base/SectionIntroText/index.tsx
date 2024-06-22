import { Typography, styled } from "@mui/material";
import { TEXT_SECONDARY_COLOR } from "src/constants";

export const SectionIntroText = styled(Typography)<{ fontSize?: string }>(
  ({ fontSize }) => ({
    color: TEXT_SECONDARY_COLOR,
    fontSize: fontSize ?? "inherit",
    lineHeight: "140%",
    letterSpacing: "0.17px",
  })
);
