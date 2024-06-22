import { PageTitle } from "@components/base/PageTitle/PageTitle";
import { EnsureWalletNetwork } from "@components/data/EnsureWalletNetwork/EnsureWalletNetwork";
import { Refresh, TokenIcon } from "@components/index";
import { PlaceOrderModal } from "@components/modals/PlaceOrderModal/PlaceOrderModal";
import { OrderTable } from "@components/orders/OrderTable/OrderTable";
import {
  Button, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Stack
} from "@mui/material";
import { useActiveEVMChainConfig } from "@services/chains/hooks/useActiveEVMChainConfig";
import { useAllOrders } from "@services/orders/hooks/useAllOrders";
import { useOrderStats } from "@services/orders/hooks/useOrderStats";
import { OrderStatusFilter } from "@services/subgraph/subgraph";
import { getTokenBySymbol } from "@services/tokens/tokens";
import { useScreenSize } from "@services/ui-ux/hooks/useScreenSize";
import { formatNumber } from "@utils/formatNumber";
import {
  useState
} from "react";
import { PAGINATION_OPTION } from "src/constants";
import { SocialGroup } from "../../components/base/SocialGroup";
import { TableTitleWrapper, TradedAmountSymbol, TradedAmountValue } from "./OrdersPage.styles";

const OrdersPage = () => {
  const [start, setStart] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>(OrderStatusFilter.ALL);
  const { isLoading, orders, total, fetch, handlePlacedOrder } = useAllOrders(start, PAGINATION_OPTION.limit, undefined, undefined, statusFilter);
  const [showPlaceOrderModal, setShowPlaceOrderModal] = useState(false);
  const { usdtAmount, usdcAmount, btcAmount } = useOrderStats();
  const { isXsScreen } = useScreenSize();
  const activeChain = useActiveEVMChainConfig();
  const usdtToken = getTokenBySymbol(activeChain, "USDT");
  const usdcToken = getTokenBySymbol(activeChain, "USDC");
  const btcToken = getTokenBySymbol(activeChain, "BTC");

  const handleRefresh = () => {
    fetch();
  }

  const onPageChanged = (p: number) => {
    setStart((p - 1) * PAGINATION_OPTION.limit);
  }

  const handleStatusFilterChange = (e: SelectChangeEvent<OrderStatusFilter>) => {
    setStart(0); // Reset page to 0
    setStatusFilter(e.target.value as OrderStatusFilter);
  }

  return (
    <>
      <TableTitleWrapper>
        <Stack direction="row" sx={{ alignItems: "center", justifyItems: "center", marginRight: 2 }} gap={2}>
          <PageTitle>Orders</PageTitle>
          <Refresh onRefresh={handleRefresh} />
        </Stack>
        <EnsureWalletNetwork continuesTo="Lend tokens" btcAccountNeeded evmConnectedNeeded>
          <Button variant="contained" onClick={() => setShowPlaceOrderModal(true)}>Lend tokens</Button>
        </EnsureWalletNetwork>
      </TableTitleWrapper>

      <Stack direction={!isXsScreen ? "row" : "column"} style={{ justifyContent: "space-between", marginTop: 12 }}>
        {/* Stats */}
        <Stack direction="row" sx={{ alignItems: "center", justifyItems: "center", justifyContent: "center" }} gap={1}>
          <TradedAmountSymbol>Completed</TradedAmountSymbol>
          <TokenIcon token={usdtToken} style={{ height: 20 }} />
          <TradedAmountValue>{usdtAmount && formatNumber(usdtAmount, { decimal: 2 })}</TradedAmountValue>
          <TokenIcon token={usdcToken} style={{ height: 20 }} />
          <TradedAmountValue>{usdcAmount && formatNumber(usdcAmount, { decimal: 2 })}</TradedAmountValue>
          <TokenIcon token={btcToken} style={{ height: 20 }} />
          <TradedAmountValue>{btcAmount && formatNumber(btcAmount, { decimal: 6 })}</TradedAmountValue>
        </Stack>
        {/* Filters */}
        <Stack direction="row" sx={{ justifyItems: "center", justifyContent: "center" }} gap={2}>
          {/*  Order status (open, all) */}
          <FormControl sx={{ m: !isXsScreen ? 1 : 0, marginTop: !isXsScreen ? 1 : 2, minWidth: 100 }} size="small">
            <InputLabel id="status-label">Status</InputLabel>
            <Select labelId="status-label" id="status-select" value={statusFilter} label="Status" onChange={handleStatusFilterChange}>
              <MenuItem value={OrderStatusFilter.ALL}>All</MenuItem>
              <MenuItem value={OrderStatusFilter.OPEN}>Open</MenuItem>
              <MenuItem value={OrderStatusFilter.ON_GOING}>On going</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack >

      <OrderTable isLoading={isLoading} orders={orders} total={total} onPageChanged={onPageChanged} />

      {showPlaceOrderModal && <PlaceOrderModal open={showPlaceOrderModal} onHandleClose={() => setShowPlaceOrderModal(false)} onOrderPlaced={handlePlacedOrder} />}
      <SocialGroup />
    </>
  );
};

export default OrdersPage;
