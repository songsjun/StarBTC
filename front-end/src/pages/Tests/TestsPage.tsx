import { PageTitle } from "@components/base/PageTitle/PageTitle";
import { EnsureWalletNetwork } from "@components/data/EnsureWalletNetwork/EnsureWalletNetwork";
import { WalletContext } from "@contexts/WalletContext";
import { Button, Stack } from "@mui/material";
import { TableTitleWrapper } from "@pages/OrdersPage/OrdersPage.styles";
import { useBitcoinWalletAction } from "@services/btc/hooks/useBitcoinWalletAction";
import { FC, useCallback, useContext } from "react";

const TestsPage: FC = () => {
  const { bitcoinAccount } = useContext(WalletContext);
  const { sendBitcoin } = useBitcoinWalletAction();

  const handleSendBitcoin = useCallback(async (satsPerVb: number) => {
    // Send to self
    try {
      const result = await sendBitcoin(bitcoinAccount, 1000, satsPerVb);
      console.log("Send bitcoin result (txid):", result);
    }
    catch (e) {
      console.error("Send bitcion test error:", e);
    }
  }, [bitcoinAccount, sendBitcoin]);

  return (
    <Stack direction="column" gap={3}>
      <TableTitleWrapper>
        <Stack direction="row" sx={{ alignItems: "center", justifyItems: "center" }} gap={2}>
          <PageTitle>Internal tests</PageTitle>
        </Stack>
      </TableTitleWrapper>

      <EnsureWalletNetwork continuesTo="Send BTC" btcAccountNeeded evmConnectedNeeded>
        <Button variant="contained" onClick={() => handleSendBitcoin(null)}>Send BTC (auto sats/vB)</Button>
        <Button variant="contained" onClick={() => handleSendBitcoin(15)}>Send BTC (15 sats/vB)</Button>
        <Button variant="contained" onClick={() => handleSendBitcoin(30)}>Send BTC (30 sats/vB)</Button>
      </EnsureWalletNetwork>
    </Stack>
  );
};

export default TestsPage;
