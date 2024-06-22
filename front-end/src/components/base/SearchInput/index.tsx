import SearchIcon from "@mui/icons-material/Search";
import { InputBaseProps } from "@mui/material";
import { FC } from "react";

import { TEXT_PRIMARY_COLOR } from "../../../constants";

import {
  Search,
  SearchIconWrapper,
  StyledInputBase,
} from "./SearchInput.styles";

export const SearchInput: FC<InputBaseProps> = (props) => {
  return (
    <Search>
      <SearchIconWrapper>
        <SearchIcon
          sx={{ color: TEXT_PRIMARY_COLOR, width: "24px", height: "auto" }}
        />
      </SearchIconWrapper>
      <StyledInputBase {...props} />
    </Search>
  );
};
