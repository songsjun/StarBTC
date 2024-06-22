import { Stack, styled } from "@mui/material";

export const ModalButtonStack = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  justifyContent: "space-around",
  gap: "20px",
  borderTop: "1px solid rgba(0, 0, 0, 0.12)",
  padding: "20px 40px",
  [theme.breakpoints.down("md")]: {
    padding: "8px 8px",
    flexDirection: "column", // Stack buttons on top of each other on mobile.
  },
}));
