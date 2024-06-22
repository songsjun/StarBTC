import { TableRow, Typography, alpha, styled } from "@mui/material";
import { TEXT_SECONDARY_COLOR } from "src/constants";

export const StyledTableRow = styled(TableRow)(() => ({
  cursor: "pointer",
  transition: "background 0.2s ease",
  '&:hover': {
    backgroundColor: '#080A1E',
  }
}));

export const OrderDate = styled(Typography)({
  fontSize: "10px",
});

export const USDAmount = styled(Typography)({
  fontSize: "14px",
  color: alpha(TEXT_SECONDARY_COLOR, 1)
});