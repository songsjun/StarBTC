import { Box, Grid, Stack, styled } from "@mui/material";
import { BACKGROUND_SECONDARY_COLOR } from "src/constants";

export const CellContent = styled(Grid)(() => ({
  display: "grid",
  alignItems: "center",
  gridAutoFlow: "column",
  width: "fit-content",
  gap: 4
}));

export const MainContentStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  margin: "34px 20px",
  gap: 30,
  overflowY: "auto",
  [theme.breakpoints.down("md")]: {
    margin: "24px 10px",
    //width: "70vw"
  }
}));

export const OrderExpiredBox = styled(Box)(() => ({
  alignContent: "center",
  textAlign: "center",
  margin: 10,
  padding: 10,
  background: "rgba(0,0,0,0.3)"
}));

export const OrderID = styled("span")(() => ({
  color: BACKGROUND_SECONDARY_COLOR,
  fontSize: 14,
  overflowWrap: "anywhere"
}));

/** Stack that aligns horizontally, with gap, centered. Used to show tooltips next to table row headers */
export const OrderTableCellHeading = styled(Stack)(() => ({
  gap: 5,
  alignItems: "center",
  flexDirection: "row"
}));