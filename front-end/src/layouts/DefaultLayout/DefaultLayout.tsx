import { LogoButton } from "@components/base/LogoButton";
import { NavigationMenu } from "@components/menus/NavigationMenu/NavigationMenu";
import { WalletSetting } from "@components/menus/WalletSetting/WalletSetting";
import { Box, Container } from "@mui/material";
import { Outlet } from "react-router-dom";
import { MainContainer, MainContainerWrapper, StyledAppBar, StyledToolbar, } from "./DefaultLayout.styles";

const DefaultLayout = () => (
  <>
    <StyledAppBar position="absolute" elevation={0}>
      <Container maxWidth="lg">
        <StyledToolbar disableGutters>
          <LogoButton />
          <Box sx={{ display: "flex", flexGrow: 1 }} />
          <NavigationMenu />
          <WalletSetting />
        </StyledToolbar>
      </Container>
    </StyledAppBar>
    <MainContainerWrapper>
      <MainContainer maxWidth="lg">
        <Outlet />
      </MainContainer>
    </MainContainerWrapper>
  </>
);

export default DefaultLayout;