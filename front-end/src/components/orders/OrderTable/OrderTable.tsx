import { CardTableContainer, CardTableItem } from "@components/base/CardTable";
import { Loading } from "@components/base/Loading";
import { DepositedToken } from "@components/data/DepositedToken/DepositedToken";
import { NoData } from "@components/data/NoData";
import { OrderModal } from "@components/modals/OrderModal/OrderModal";
import { Pagination, Stack, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow } from "@mui/material";
import { useOrderCreator } from "@services/orders/hooks/ownership/useOrderCreator";
import { useOrderFriendlyStatus } from "@services/orders/hooks/useOrderFriendlyStatus";
import { LoanOrder, LoanOrderType } from "@services/orders/model/loan-order";
import { useCoinPrice } from "@services/pricing/hooks/useCoinPrice";
import { useScreenSize } from "@services/ui-ux/hooks/useScreenSize";
import { formatAddress } from "@utils/formatAddress";
import { formatUSD } from "@utils/formatNumber";
import { FC, useEffect, useState } from "react";
import { BACKGROUND_SECONDARY_COLOR, PAGINATION_OPTION } from "src/constants";
import { OrderDate, StyledTableRow, USDAmount } from "./OrderTable.styles";
import { useOrderInteraction } from "./hooks/useOrderInteraction";

/**
 * Table that lists a set of orders, with pagination.
 */
export const OrderTable: FC<{
  orders: LoanOrder[];
  total: number;
  isLoading?: boolean;
  onPageChanged?: (page: number) => void;
}> = props => {
  const { orders, total, isLoading = false, onPageChanged } = props;
  const hasOrders = orders?.length > 0;
  const [page, setPage] = useState(PAGINATION_OPTION.initPage);
  const { isXsScreen } = useScreenSize();
  const [isOrderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LoanOrder | undefined>(undefined);

  const handleRowClicked = (order: LoanOrder) => {
    if (order.type !== LoanOrderType.LENDING)
      return;

    setOrderModalOpen(true);
    setSelectedOrder(order);
  }

  const handleCloseOrderModal = () => {
    setOrderModalOpen(false);
    setSelectedOrder(undefined);
  }

  useEffect(() => {
    onPageChanged?.(page);
  }, [page, onPageChanged]);

  return (<>
    {isLoading && <Loading />}
    {!isLoading && !hasOrders && <NoData />}

    {/* Small screens */}
    {
      !isLoading && hasOrders && isXsScreen &&
      <CardTableContainer page={page} total={total} onPageChange={setPage}>
        {orders.map((order, index) => <SmallOrderCard order={order} key={index} onClick={() => handleRowClicked(order)} />)}
      </CardTableContainer>
    }

    {/* Large screen content */}
    {!isLoading && hasOrders && !isXsScreen && (
      <TableContainer>
        <Table>
          {/* Header */}
          <TableHead>
            <TableRow>
              <TableCell align="center">Loan contract</TableCell>
              <TableCell align="left">Creation</TableCell>
              <TableCell align="center">Creator</TableCell>
              <TableCell align="center">Type</TableCell>
              <TableCell align="left">Amount</TableCell>
              <TableCell align="left">Status</TableCell>
            </TableRow>
          </TableHead>

          {/* Body */}
          <TableBody>
            {/* No data */}
            {total === 0 && (
              <TableRow>
                <TableCell colSpan={12}>
                  <NoData />
                </TableCell>
              </TableRow>
            )}

            {/* Orders list */}
            {orders.map((order, index) => <OrderRow order={order} key={index} onClick={() => handleRowClicked(order)} />)}
          </TableBody>

          {/* Pagination */}
          {total > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={9}>
                  <Stack alignItems="center" justifyContent="center">
                    <Pagination
                      page={page}
                      count={Math.ceil(total / PAGINATION_OPTION.limit)}
                      onChange={(_, index) => setPage(index)}
                      shape="rounded"
                    />
                  </Stack>
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </TableContainer>
    )}
    {selectedOrder && <OrderModal order={selectedOrder} open={isOrderModalOpen} onHandleClose={handleCloseOrderModal} />}
  </>
  )
}

/**
 * Table row for larger screens.
 */
const OrderRow: FC<{
  order: LoanOrder;
  onClick: () => void;
}> = ({ order, onClick }) => {
  const depositedToken = order?.token;
  const depositedTokenPrice = useCoinPrice(depositedToken?.symbol);
  const depositedMarketValue = order.tokenAmount.multipliedBy(depositedTokenPrice);
  // const requestedAmount = useOrderAmountOut(order);
  // const requestedMarketValue = requestedAmount?.multipliedBy(btcPrice);
  const status = useOrderFriendlyStatus(order);
  const { canInteract } = useOrderInteraction(order);
  const creatorEVMAddress = useOrderCreator(order);

  return (
    <StyledTableRow onClick={onClick} style={{ opacity: !canInteract ? 0.5 : 1 }}>
      {/* Order contract address */}
      <TableCell align="center">{formatAddress(order.id, [8, 6])}</TableCell>
      {/* Creation date */}
      <TableCell align="left">
        <OrderDate><b>{order.createdAt.toLocaleDateString()}</b><br />{order.createdAt.toLocaleTimeString()}</OrderDate>
      </TableCell>
      {/* Creator */}
      <TableCell align="center">{formatAddress(creatorEVMAddress, [8, 6])}</TableCell>
      {/* Order type */}
      <TableCell align="center">{order.type === LoanOrderType.BORROW ? "Borrow request" : "Lending request"}</TableCell>
      {/* Amount involved */}
      <TableCell align="left">
        <DepositedToken justifyContent="flex-start" amount={order.tokenAmount} token={depositedToken} />
        {depositedTokenPrice && <USDAmount>{formatUSD(depositedMarketValue)}</USDAmount>}
      </TableCell>
      <TableCell align="left">{status}</TableCell>
    </StyledTableRow>
  )
}

const SmallOrderCard: FC<{ order: LoanOrder; onClick: () => void; }> = ({ order, onClick }) => {
  const depositedToken = order?.token;
  const status = useOrderFriendlyStatus(order);
  const { canInteract } = useOrderInteraction(order);

  const formattedData = [
    {
      title: "ID",
      value: <span style={{ color: BACKGROUND_SECONDARY_COLOR }}>{formatAddress(order.id, [6, 4])}</span>,
      xs: 6
    },
    {
      title: "Amount",
      value: <DepositedToken amount={order.tokenAmount} token={depositedToken} justifyContent="flex-start" />,
      xs: 6
    },
    {
      title: "Type",
      value: order.type === LoanOrderType.BORROW ? "Borrow" : "Lend",
      xs: 6
    },
    {
      title: "Status",
      value: status,
      xs: 6
    }
  ];

  return <CardTableItem onClick={onClick} data={formattedData} opacity={!canInteract ? 0.5 : 1} />
}
