import { InputBase, styled } from "@mui/material";

import { TEXT_INVERTED_COLOR } from "../../../constants";

export const Search = styled("div")({
  position: "relative",
  borderRadius: "8px",
  border: "2px solid rgba(190, 194, 218, 0.30)",
  backgroundColor: "rgba(32, 30, 41, 0.20)",
  flexGrow: 1,
});

export const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: TEXT_INVERTED_COLOR,
  width: "100%",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
  },
  [theme.breakpoints.down("sm")]: {
    "& .MuiInputBase-input": {
      padding: theme.spacing(0.5, 0.5, 0.5, 0),
      paddingLeft: `calc(1em + ${theme.spacing(4)})`,
      height: "22px",
      fontSize: "12px",
    },
  },
}));

export const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));
