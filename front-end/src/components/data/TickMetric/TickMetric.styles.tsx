import styled from "@emotion/styled";
import { Typography } from "@mui/material";

import { TEXT_PRIMARY_COLOR } from "../../../constants";

export const TickText = styled(Typography)({
  color: TEXT_PRIMARY_COLOR,
  fontSize: "16px",
  fontStyle: "italic",
  fontWeight: 600,
  lineHeight: "143%",
});
