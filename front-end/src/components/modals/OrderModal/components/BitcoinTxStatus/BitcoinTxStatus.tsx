import BadgeBlue from "@assets/badge-blue.svg"
import { ExternalLinkType, LinkToExternalTx } from "@components/base/LinkToExternalTx/LinkToExternalTx"
import { ResponsiveTableCell } from "@components/base/ResponsiveTable/ResponsiveTableCell"
import { ResponsiveTableRow } from "@components/base/ResponsiveTable/ResponsiveTableRow"
import { Stack } from "@mui/material"
import { isNullBitcoinTxId } from "@services/btc/btc"
import { useCurrentBlock } from "@services/btc/hooks/useLatestBlock"
import { usePollTransactionDetails } from "@services/btc/hooks/useTransactionDetails"
import { useOrderBorrowerVerificationStatus, useOrderLenderVerificationStatus } from "@services/orders/hooks/useOrderVerificationStatus"
import { usePaidBTCOrder } from "@services/orders/hooks/usePaidBTCOrders"
import { LoanOrder, LoanOrderVerificationStatus } from "@services/orders/model/loan-order"
import { BTCOrderTarget } from "@services/orders/storage"
import { useBehaviorSubject } from "@services/ui-ux/hooks/useBehaviorSubject"
import { formatAddress } from "@utils/formatAddress"
import moment from "moment"
import { FC, useEffect, useMemo, useState } from "react"
import { useInterval } from "react-use"
import { CellContent } from "../../OrderModal.styles"
import { DetailsTableCellHeader } from "../OrderDetailsTable/OrderDetailsTable.styles"

type BitcoinTxStatusPurpose = "toLender" | "regularLenderUnlock";

export const BitcoinTxStatus: FC<{
  order: LoanOrder;
  purpose: BitcoinTxStatusPurpose;
}> = ({ order, purpose }) => {
  const { block, refreshBlockInfo } = useCurrentBlock();
  useInterval(refreshBlockInfo, 5000);
  const lastBlockMinutes = block && moment().diff(moment(block.time * 1000), "minutes");
  const toLenderBtcTx = useBehaviorSubject(order.toLenderBtcTx);
  const lenderUnlockBtcTx = useBehaviorSubject(order.toBorrowerBtcTx);
  const paidBTCOrder = usePaidBTCOrder(order.id, purposeToOrderTarget(purpose));
  const [targetTxId, setTargetTxId] = useState<string>(undefined);
  const [isZKPVerified, setZKPVerified] = useState<boolean>();
  const transaction = usePollTransactionDetails(targetTxId);
  const isMined = transaction?.confirmations > 0;
  const loading = transaction === undefined || block === undefined;
  const toLenderZKPStatus = useOrderBorrowerVerificationStatus(order);
  const regularLenderUnlockZKPStatus = useOrderLenderVerificationStatus(order);

  useEffect(() => {
    switch (purpose) {
      case "toLender":
        setTargetTxId(!isNullBitcoinTxId(toLenderBtcTx?.txId) ? toLenderBtcTx.txId : paidBTCOrder.txHash);
        setZKPVerified(toLenderZKPStatus === LoanOrderVerificationStatus.VERIFIED);
        break;
      case "regularLenderUnlock":
        setTargetTxId(!isNullBitcoinTxId(lenderUnlockBtcTx?.txId) ? lenderUnlockBtcTx.txId : paidBTCOrder.txHash);
        setZKPVerified(regularLenderUnlockZKPStatus === LoanOrderVerificationStatus.VERIFIED);
        break;
      default:
        throw new Error("Unsupported purpose for BitcoinTxStatus");
    }
  }, [purpose, toLenderBtcTx, lenderUnlockBtcTx, regularLenderUnlockZKPStatus, toLenderZKPStatus, paidBTCOrder]);

  const title = useMemo(() => {
    switch (purpose) {
      case "toLender": return "BTC transfer to lender";
      case "regularLenderUnlock": return "BTC unlock transfer";
    }
  }, [purpose]);

  const statusMessage = useMemo(() => {
    if (loading)
      return "...";
    if (isNullBitcoinTxId(targetTxId))
      return "Not published";
    else if (isMined)
      return `Mined ${transaction?.confirmations} blocks ago.`;
    else {
      if (lastBlockMinutes <= 0)
        return `Not mined yet. Last block was a few seconds ago`;
      else
        return `Not mined yet. Last block was ${lastBlockMinutes} minute${lastBlockMinutes > 1 ? "s" : ""} ago`;
    }
  }, [isMined, lastBlockMinutes, transaction, targetTxId, loading]);

  return (
    <ResponsiveTableRow>
      <DetailsTableCellHeader>
        {title}
        {isZKPVerified && <Stack direction="row" style={{ color: "#45a0ff", fontSize: 12, alignItems: "center" }}><img src={BadgeBlue} /> ZKP Verified</Stack>}
      </DetailsTableCellHeader>
      <ResponsiveTableCell>
        {statusMessage}
        {
          targetTxId &&
          <CellContent>
            Transaction {formatAddress(targetTxId, [6, 6])}
            <LinkToExternalTx tx={targetTxId} target={ExternalLinkType.BTC} />
          </CellContent>
        }
      </ResponsiveTableCell>
    </ResponsiveTableRow>
  )
}

const purposeToOrderTarget = (purpose: BitcoinTxStatusPurpose): BTCOrderTarget => {
  switch (purpose) {
    case "toLender": return "borrower-borrow";
    case "regularLenderUnlock": return "lender-unlock";
    default:
      throw new Error("Unhandled purpose to convert to order target");
  }
}