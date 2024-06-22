import Logo from "@assets/logo-with-text.png";
import { Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { LogoText, StyledButtonBase } from "./LogoButton.styles";

export const LogoButton = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <Stack direction={"row"} gap={1} alignContent="flex-start">
      <StyledButtonBase onClick={handleLogoClick}>
        <img src={Logo} style={{ height: "100%" }} />
      </StyledButtonBase>
      <LogoText>Lending</LogoText>
    </Stack>
  );
};
