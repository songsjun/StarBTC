import { List, ListItemButton, styled } from "@mui/material";

import { TEXT_PRIMARY_COLOR, TEXT_SECONDARY_COLOR } from "../../../constants";

export const StyledList = styled(List)({
  display: "flex",
  flexDirection: "row",
  padding: 0,
});

export const StyledListItemButton = styled(ListItemButton)({
  backgroundColor: "rgba(0, 0, 0, 0)",
  color: TEXT_SECONDARY_COLOR,

  textEdge: "cap",
  fontSize: "18px",
  fontWeight: 400,
  lineHeight: "150%",

  "&.Mui-selected": {
    backgroundColor: "rgba(0, 0, 0, 0)",
    color: TEXT_PRIMARY_COLOR,
    fontWeight: 700,

    ":hover": {
      backgroundColor: "rgba(0, 0, 0, 0)",
    },
  },
});
