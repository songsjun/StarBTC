import { ResponsiveTableCell } from "@components/base/ResponsiveTable/ResponsiveTableCell";
import { styled } from "@mui/material";

export const DetailsTableCellHeader = styled(ResponsiveTableCell)(() => ({
  fontWeight: 600
}));

export const USDValuation = styled("span")(() => ({
  opacity: 0.5
}));