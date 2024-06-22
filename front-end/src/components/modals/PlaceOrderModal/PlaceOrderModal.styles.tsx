import { Stack, TextField, Typography, alpha, styled } from "@mui/material";
import { TEXT_INVERTED_COLOR, TEXT_SECONDARY_COLOR } from "src/constants";

export const MainContentStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  margin: "34px 20px",
  gap: 30,
  overflowY: "auto",
  [theme.breakpoints.down("md")]: {
    margin: "24px 10px",
  }
}));

export const FormRow = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: "20px",
  width: "100%",
  [theme.breakpoints.down("sm")]: {
    fontSize: "14px",
    "& .MuiOutlinedInput-root": {
      height: "42px",
    },
  },
}));

export const NameField = styled(Typography)({
  fontWeight: 600
});

export const USDValueField = styled(Typography)({
  color: alpha(TEXT_INVERTED_COLOR, 0.7),
  fontSize: "inherit",
  fontWeight: 300,
  lineHeight: "143%",
});

export const StyledTextField = styled(TextField)(({ theme }) => ({
  maxWidth: "460px",
  flex: 1,
  [theme.breakpoints.down("sm")]: {
    // height: "34px"
  },
  input: {
    // color: alpha(TEXT_SECONDARY_COLOR, 1),
    [theme.breakpoints.down("sm")]: {
      fontSize: "14px",
      // padding: "4px 6px",
    },
  },

  "& label": {
    color: alpha(TEXT_SECONDARY_COLOR, 0.2),
  },
  "& label.Mui-focused": {
    color: alpha(TEXT_SECONDARY_COLOR, 0.2),
  },
  "& .MuiInput-underline:after": {
    borderBottomColor: alpha(TEXT_SECONDARY_COLOR, 0.2),
  },
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: alpha(TEXT_SECONDARY_COLOR, 0.2),
    },
    "&:hover fieldset": {
      borderColor: alpha(TEXT_SECONDARY_COLOR, 0.2),
    },
    "&.Mui-focused fieldset": {
      borderColor: alpha(TEXT_SECONDARY_COLOR, 0.2),
    },
  },
}));