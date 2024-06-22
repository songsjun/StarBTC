import MenuIcon from "@mui/icons-material/Menu";
import { Stack } from "@mui/material";
import { PATH_MY_ORDERS, PATH_ORDERS } from "@routes/paths";
import { useScreenSize } from "@services/ui-ux/hooks/useScreenSize";
import { matchPath, useLocation, useNavigate } from "react-router-dom";
import { CompactMenu } from "../CompactMenu";
import { StyledList, StyledListItemButton } from "./NavigationMenu.styles";
import { BTCBalance } from "./components/BTCBalance";
import { ERC20Balance } from "./components/ERC20Balance";
import { LockedBTCBalance } from "./components/LockedBTCBalance";

export const NavigationMenu = () => {
  const { isXsScreen, isSmScreen } = useScreenSize();
  const navigate = useNavigate();
  const location = useLocation();

  const routePaths = {
    ORDERS: "All loans",
    MY_ORDERS: "My loans"
  };

  const options = [
    {
      value: routePaths.ORDERS,
      path: PATH_ORDERS,
      matchPaths: [PATH_ORDERS, `${PATH_ORDERS}/*`],
    },
    {
      value: routePaths.MY_ORDERS,
      path: PATH_MY_ORDERS,
      matchPaths: [PATH_MY_ORDERS, `${PATH_MY_ORDERS}/*`],
    }
  ];

  const handleOnClick = (selectedValue: string) => {
    const option = options.find(({ value }) => value === selectedValue);
    if (!option) return;
    navigate(option.path);
  };

  const selectedOption = options.find(({ matchPaths }) =>
    matchPaths.some((path) => matchPath(path, location.pathname))
  );

  return (
    <>
      {!isXsScreen && !isSmScreen && (
        <StyledList>
          {options.map(({ value }) => (
            <StyledListItemButton
              key={value}
              selected={value === selectedOption?.value}
              onClick={() => handleOnClick(value)}
            >
              {value}
            </StyledListItemButton>
          ))}
        </StyledList>
      )}
      {isXsScreen && (
        <CompactMenu
          menuOptions={options.map((option) => ({
            display: option.value,
            action: () => navigate(option.path),
            hideAfterAction: true,
          }))}
        >
          <MenuIcon />
        </CompactMenu>
      )}
      {
        !isXsScreen && !isSmScreen &&
        <>
          <Stack direction="row" alignItems="center" gap={1} mr={4} ml={4}>
            <ERC20Balance symbol="USDT" />
            <ERC20Balance symbol="USDC" />
            <BTCBalance />
          </Stack>
          <Stack direction="row" alignItems="center" gap={1} mr={4} ml={4}>
            <LockedBTCBalance />
          </Stack>
        </>
      }
    </>
  );
};