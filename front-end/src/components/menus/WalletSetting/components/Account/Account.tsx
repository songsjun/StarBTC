import { CompactMenu, CompactMenuEntry } from "@components/menus/CompactMenu";
import { BTCBalance } from "@components/menus/NavigationMenu/components/BTCBalance";
import { ERC20Balance } from "@components/menus/NavigationMenu/components/ERC20Balance";
import { LockedBTCBalance } from "@components/menus/NavigationMenu/components/LockedBTCBalance";
import { BitcoinWalletChooserContext } from "@components/modals/BitcoinWalletChooser/BitcoinWalletChooser";
import { WalletContext } from "@contexts/WalletContext";
import {
  Logout
} from "@mui/icons-material";
import { Button, Stack, Switch } from "@mui/material";
import { useBitcoinWalletAction } from "@services/btc/hooks/useBitcoinWalletAction";
import { useEVMWallet } from "@services/evm/hooks/useEVMWallet";
import { useCopyText } from "@services/ui-ux/hooks/useCopyText";
import { useScreenSize } from "@services/ui-ux/hooks/useScreenSize";
import { formatAddress } from "@utils/formatAddress";
import { FC, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AccountAddress, ExpandMoreIcon, MenuItemText, TestnetLabel } from "./Account.styles";

export const Account = () => {
  const navigate = useNavigate();
  const { evmAccount, bitcoinAccount } = useContext(WalletContext);
  const { handleDisconnect } = useEVMWallet();
  const { promptBitcoinWallet } = useContext(BitcoinWalletChooserContext);
  const { disconnectWallet } = useBitcoinWalletAction();
  const { copyText } = useCopyText();
  const [options, setOptions] = useState<CompactMenuEntry[]>([]);
  const { isXsScreen } = useScreenSize();
  const { networkMode } = useContext(WalletContext);

  const handleCopyEVMAddress = useCallback(async () => {
    await copyText(evmAccount!, "EVM address copied!");
  }, [evmAccount, copyText]);

  const handleCopyBitcoinAddress = useCallback(async () => {
    await copyText(bitcoinAccount!, "Bitcoin address copied!");
  }, [copyText, bitcoinAccount]);

  const handleDisconnectBitcoinWallet = useCallback(() => {
    disconnectWallet();
  }, [disconnectWallet]);

  useEffect(() => {
    let _options: CompactMenuEntry[] = [];

    evmAccount && _options.push({
      display: <AccountAddress>{formatAddress(evmAccount, [5, 4])}</AccountAddress>,
      action: handleCopyEVMAddress,
    });
    isXsScreen && _options.push({ display: (<ERC20Balance symbol="USDT" />) });
    isXsScreen && _options.push({ display: (<ERC20Balance symbol="USDC" />) });

    _options.push(...[{
      display: (
        <>
          <Logout fontSize="small" sx={{ color: "inherit" }} />
          <MenuItemText>Disconnect wallet</MenuItemText>
        </>
      ),
      action: handleDisconnect,
    },
    {
      display: (<>
        {bitcoinAccount && <AccountAddress>{formatAddress(bitcoinAccount, [5, 4])}</AccountAddress>}
        {!bitcoinAccount && <AccountAddress>Bitcoin</AccountAddress>}
      </>),
      action: () => { bitcoinAccount && handleCopyBitcoinAddress() },
    }
    ]);

    if (!!bitcoinAccount) {
      isXsScreen && _options.push({ display: (<BTCBalance />) });
      isXsScreen && _options.push({ display: (<LockedBTCBalance />) });
      _options.push(...[
        {
          display: (
            <>
              <Logout fontSize="small" sx={{ color: "inherit" }} />
              <MenuItemText>Disconnect wallet</MenuItemText>
            </>
          ),
          action: handleDisconnectBitcoinWallet,
        }
      ]);
    }
    else {
      _options.push({
        display: (
          <>
            <Button
              variant="contained"
              onClick={() => { promptBitcoinWallet() }}
              size="small"
              sx={{ fontSize: { xs: "10px", sm: "16px" } }}
            >
              Connect Bitcoin Wallet
            </Button>
          </>
        )
      });
    }

    _options.push({ display: <MainnetTestnetSwitch /> });

    setOptions(_options);
  }, [evmAccount, isXsScreen, bitcoinAccount, navigate, promptBitcoinWallet, handleCopyEVMAddress, handleDisconnect, handleCopyBitcoinAddress, handleDisconnectBitcoinWallet]);

  if (!evmAccount) {
    return null;
  }

  return (
    <CompactMenu menuOptions={options}>
      <Stack spacing="2px" direction="row" alignItems="center">
        {/* <AccountAddress>{formatAddress(account, [5, 4])}</AccountAddress> */}
        <Stack direction="column">
          <AccountAddress>Connected</AccountAddress>
          {networkMode === "testnet" && <TestnetLabel>TESTNET</TestnetLabel>}
        </Stack>
        <ExpandMoreIcon />
      </Stack>
    </CompactMenu>
  );
};

const MainnetTestnetSwitch: FC = () => {
  const { networkMode, setNetworkMode } = useContext(WalletContext);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNetworkMode(e.target.checked ? "mainnet" : "testnet");
  }

  return (
    <Stack direction="row" gap={1} alignItems="center">
      <Switch checked={networkMode === "mainnet"} onChange={handleChange}></Switch> {networkMode === "mainnet" ? "Mainnet" : "Testnet"} mode
    </Stack>
  )
}