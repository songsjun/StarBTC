import EssentialsWallet from "@assets/wallets/essentials.svg";
import OkxWallet from "@assets/wallets/okx.svg";
import UnisatWallet from "@assets/wallets/unisat.svg";
import { Web3ProviderProps } from "@contexts/WalletContext";
import { Button, Modal, ModalProps, Stack } from "@mui/material";
import { useOkxWallet } from "@services/btc/hooks/useOkxWallet";
import { useUnisatWallet } from "@services/btc/hooks/useUnisatWallet";
import { FC, createContext, memo, useCallback, useMemo, useState } from "react";
import { ModalBaseHeader } from "../..";
import { ModalButtonStack } from "../ModalButtonStack/ModalButtonStack";
import { ModalRootCard } from "../ModalRootCard/ModalRootCard";
import { MainContentStack } from "../OrderModal/OrderModal.styles";
import { WalletIcon, WalletRow } from "./BitcoinWalletChooser.styles";

/**
 * Modal to let user choose his bitcoin wallet
 */
export const BitcoinWalletChooserModal: FC<Omit<ModalProps, "children"> & {
  onHandleClose: () => void;
}> = (props) => {
  const { open, onHandleClose, ...rest } = props;
  const { connectWallet: connectUnisat } = useUnisatWallet();
  const { connectWallet: connectOkx } = useOkxWallet();

  const isInsideEssentials = useMemo(() => {
    return window.unisat?.isEssentials || window.okxwallet?.bitcoin?.isEssentials;
  }, []);

  const handleConnectUnisat = useCallback(async () => {
    if (await connectUnisat())
      onHandleClose();
  }, [connectUnisat, onHandleClose]);

  const handleConnectOKX = useCallback(async () => {
    if (await connectOkx())
      onHandleClose();
  }, [connectOkx, onHandleClose]);

  return (
    <Modal {...rest} open={open} aria-labelledby="parent-modal-title" aria-describedby="parent-modal-description" onClose={onHandleClose}>
      <ModalRootCard style={{ width: "auto" }}>
        {/* Header */}
        <ModalBaseHeader onClose={() => onHandleClose()} ><>Pick a Bitcoin Wallet</></ModalBaseHeader>

        {/* Main form */}
        <MainContentStack>
          <Stack direction="column">
            {isInsideEssentials &&
              <WalletRow onClick={handleConnectUnisat}>
                <WalletIcon src={EssentialsWallet} />
                Essentials
              </WalletRow>
            }
            <WalletRow onClick={handleConnectUnisat} style={{ opacity: (window.unisat ? 1 : 0.3) }}>
              <WalletIcon src={UnisatWallet} />
              Unisat Wallet
            </WalletRow>
            <WalletRow onClick={handleConnectOKX} style={{ opacity: (window.okxwallet ? 1 : 0.3) }}>
              <WalletIcon src={OkxWallet} />
              OKX Wallet
            </WalletRow>
          </Stack>
        </MainContentStack>

        {/* Footer */}
        <ModalButtonStack>
          <Button
            fullWidth
            size="large"
            variant="outlined"
            onClick={onHandleClose}>
            Cancel
          </Button>
        </ModalButtonStack>
      </ModalRootCard>
    </Modal>
  );
};

export const BitcoinWalletChooserProvider = memo(({ children }: Web3ProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const promptBitcoinWallet = () => {
    setIsOpen(true);
  }

  return (
    <BitcoinWalletChooserContext.Provider value={{ promptBitcoinWallet }}>
      {children}
      <BitcoinWalletChooserModal open={isOpen} onHandleClose={() => setIsOpen(false)} />
    </BitcoinWalletChooserContext.Provider>
  );
});

type BitcoinWalletChooserProps = {
  promptBitcoinWallet: () => void;
}

export const BitcoinWalletChooserContext = createContext<BitcoinWalletChooserProps>(null);