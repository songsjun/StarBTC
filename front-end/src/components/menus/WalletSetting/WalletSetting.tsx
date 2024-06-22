import { EnsureWalletNetwork } from "@components/data/EnsureWalletNetwork/EnsureWalletNetwork";
import { Account } from "./components/Account/Account";

export const WalletSetting = () => {
  return <EnsureWalletNetwork continuesTo="Account">
    <Account />
  </EnsureWalletNetwork>
};
