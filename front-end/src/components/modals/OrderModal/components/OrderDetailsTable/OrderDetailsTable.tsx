import { ResponsiveTableCell } from "@components/base/ResponsiveTable/ResponsiveTableCell";
import { ResponsiveTableRow } from "@components/base/ResponsiveTable/ResponsiveTableRow";
import { IconTip } from "@components/base/Tip";
import { DepositedToken } from "@components/data/DepositedToken/DepositedToken";
import { Stack, Table, TableBody } from "@mui/material";
import { isNullBitcoinTxId } from "@services/btc/btc";
import { useActiveEVMChainConfig } from "@services/chains/hooks/useActiveEVMChainConfig";
import { isNullOrEmptyAddress } from "@services/evm/utils";
import { useOrderRepayExpiration } from "@services/orders/hooks/expirations/useOrderRepayExpiration";
import { useOrderRepayUnlockExpiration } from "@services/orders/hooks/expirations/useOrderRepayUnlockExpiration";
import { useOrderCreator } from "@services/orders/hooks/ownership/useOrderCreator";
import { useOrderTaker } from "@services/orders/hooks/ownership/useOrderTaker";
import { usePaidBTCOrder } from "@services/orders/hooks/usePaidBTCOrders";
import { LoanOrder, LoanOrderStatus } from "@services/orders/model/loan-order";
import { getTokenBySymbol } from "@services/tokens/tokens";
import { useBehaviorSubject } from "@services/ui-ux/hooks/useBehaviorSubject";
import { formatAddress } from "@utils/formatAddress";
import { FC } from "react";
import { CellContent } from "../../OrderModal.styles";
import { BitcoinTxStatus } from "../BitcoinTxStatus/BitcoinTxStatus";
import { DetailsTableCellHeader } from "./OrderDetailsTable.styles";
import { RemainingBefExpiration } from "./RemainingBefExpiration";

export const OrderDetailsTable: FC<{
  order: LoanOrder;
}> = ({ order }) => {
  const creator = useOrderCreator(order);
  const taker = useOrderTaker(order);
  const takenAt = useBehaviorSubject(order.takenAt$);
  const borrowedAt = useBehaviorSubject(order.borrowedAt$);
  const repaidAt = useBehaviorSubject(order.repaidAt$);
  const { expirationDate: repayExpirationDate, isExpired: isRepayExpired } = useOrderRepayExpiration(order);
  const { expirationDate: repaymentUnlockExpirationDate, isExpired: isRepaymentUnlockExpired } = useOrderRepayUnlockExpiration(order);
  const orderStatus = useBehaviorSubject(order.status$);
  const toLenderBtcTxId = useBehaviorSubject(order.toLenderBtcTx);
  const lenderUnlockBtcTxId = useBehaviorSubject(order.toBorrowerBtcTx);
  const paidToLenderBTCOrder = usePaidBTCOrder(order.id, "borrower-borrow");
  const paidLenderUnlockBTCOrder = usePaidBTCOrder(order.id, "lender-unlock");
  const tipToLender = order.lenderConfirmRewardsTips;
  const tipToBorrower = order.borrowerConfirmRewardsTips;
  // const serviceFee = new BigNumber(5); // TMP - USDT
  const activeChain = useActiveEVMChainConfig();
  const btcToken = getTokenBySymbol(activeChain, "BTC");

  return (
    <Table>
      <TableBody>
        <ResponsiveTableRow>
          <DetailsTableCellHeader>Amount</DetailsTableCellHeader>
          <ResponsiveTableCell>
            <CellContent>
              <DepositedToken justifyContent="flex-start" amount={order.tokenAmount} token={order.token} decimals={4} />
              <DepositedToken justifyContent="flex-start" amount={order.collateralAmount} token={btcToken} decimals={8} />
            </CellContent>
          </ResponsiveTableCell>
        </ResponsiveTableRow>
        <ResponsiveTableRow>
          <DetailsTableCellHeader>Interest</DetailsTableCellHeader>
          <ResponsiveTableCell>
            <DepositedToken justifyContent="flex-start" amount={order.interestValue} token={order.token} decimals={6} />
          </ResponsiveTableCell>
        </ResponsiveTableRow>
        <ResponsiveTableRow>
          <DetailsTableCellHeader>Created</DetailsTableCellHeader>
          <ResponsiveTableCell>
            {order.createdAt.toLocaleString()} by {formatAddress(creator, [8, 6])}
          </ResponsiveTableCell>
        </ResponsiveTableRow>
        {
          !isNullOrEmptyAddress(taker) && <ResponsiveTableRow>
            <DetailsTableCellHeader>Taken</DetailsTableCellHeader>
            <ResponsiveTableCell>
              {takenAt.toLocaleString()} by {formatAddress(taker, [8, 6])}
            </ResponsiveTableCell>
          </ResponsiveTableRow>
        }
        {
          borrowedAt && <ResponsiveTableRow>
            <DetailsTableCellHeader>Claimed</DetailsTableCellHeader>
            <ResponsiveTableCell>
              {borrowedAt.toLocaleString()} by {formatAddress(taker, [8, 6])}
            </ResponsiveTableCell>
          </ResponsiveTableRow>
        }
        <ResponsiveTableRow>
          <DetailsTableCellHeader>Repayment</DetailsTableCellHeader>
          <ResponsiveTableCell>
            <Stack direction="column">
              <Stack direction="row">
                Max {order.duration} days
                {repayExpirationDate &&
                  <CellContent>
                    &nbsp;- Before {repayExpirationDate?.toLocaleString()} <IconTip content="After this time, if not repaid, the lender can unlock the collateralized BTC to himself" />
                  </CellContent>
                }
              </Stack>
              {repayExpirationDate && orderStatus === LoanOrderStatus.BORROWED && <RemainingBefExpiration expirationDate={repayExpirationDate} isExpired={isRepayExpired} width={150} />}
            </Stack>
          </ResponsiveTableCell>
        </ResponsiveTableRow>
        {
          repaidAt && <ResponsiveTableRow>
            <DetailsTableCellHeader>Repaid</DetailsTableCellHeader>
            <ResponsiveTableCell>
              {repaidAt.toLocaleString()} by {formatAddress(taker, [8, 6])}
            </ResponsiveTableCell>
          </ResponsiveTableRow>
        }
        {orderStatus === LoanOrderStatus.REPAID &&
          <ResponsiveTableRow>
            <DetailsTableCellHeader>Repayment unlock</DetailsTableCellHeader>
            <ResponsiveTableCell>
              <Stack direction="column">
                <Stack direction="row">
                  {repaymentUnlockExpirationDate &&
                    <CellContent>
                      Before {repaymentUnlockExpirationDate?.toLocaleString()} <IconTip content="After this time, if BTC is not unlocked by the lender, the borrower can request arbitration from arbiters to unlock his BTC" />
                    </CellContent>
                  }
                </Stack>
                <RemainingBefExpiration expirationDate={repaymentUnlockExpirationDate} isExpired={isRepaymentUnlockExpired} width={150} />
              </Stack>
            </ResponsiveTableCell>
          </ResponsiveTableRow>
        }
        {(!isNullBitcoinTxId(toLenderBtcTxId?.txId) || paidToLenderBTCOrder) && <BitcoinTxStatus order={order} purpose="toLender" />}
        {(!isNullBitcoinTxId(lenderUnlockBtcTxId?.txId) || paidLenderUnlockBTCOrder) && <BitcoinTxStatus order={order} purpose="regularLenderUnlock" />}
        {
          tipToLender?.gt(0) &&
          <ResponsiveTableRow>
            <DetailsTableCellHeader>
              <CellContent>
                Tip to lender
                <IconTip content="This amount is given by the borrower to the lender, if the lender confirms the BTC transfer rapidly. Otherwise, the borrower gets it back" />
              </CellContent>
            </DetailsTableCellHeader>
            <ResponsiveTableCell>
              <DepositedToken justifyContent="flex-start" amount={tipToLender} token={order.token} decimals={0} />
            </ResponsiveTableCell>
          </ResponsiveTableRow>
        }
        {
          tipToBorrower?.gt(0) &&
          <ResponsiveTableRow>
            <DetailsTableCellHeader>
              <CellContent>
                Tip to borrower
                <IconTip content="This amount is given by the lender to the borrower, if the borrower confirms the BTC transfer rapidly during the repayment phase. Otherwise, the lender gets it back" />
              </CellContent>
            </DetailsTableCellHeader>
            <ResponsiveTableCell>
              <DepositedToken justifyContent="flex-start" amount={tipToBorrower} token={order.token} decimals={0} />
            </ResponsiveTableCell>
          </ResponsiveTableRow>
        }
      </TableBody>
    </Table>
  )
}