import { PageTitle } from "@components/base/PageTitle/PageTitle";
import { OrderTable } from "@components/orders/OrderTable/OrderTable";
import { Stack } from "@mui/material";
import { TableTitleWrapper } from "@pages/OrdersPage/OrdersPage.styles";
import { useMyOrders } from "@services/orders/hooks/useMyOrders";
import { useState } from "react";
import { PAGINATION_OPTION } from "src/constants";
import { Refresh, SocialGroup } from "../../../components";

const MyOrdersPage = () => {
  const [borrowedStart, setBorrowedStart] = useState(0);
  const [lentStart, setLentStart] = useState(0);
  const { isLoading: isBorrowedOrdersLoading, myOrders: borrowedOrders, total: borrowedOrdersTotal, fetch: refreshBorrowedOrders } = useMyOrders(borrowedStart, PAGINATION_OPTION.limit, "borrower");
  const { isLoading: isLentOrdersLoading, myOrders: lentOrders, total: lentOrdersTotal, fetch: refreshLentOrders } = useMyOrders(lentStart, PAGINATION_OPTION.limit, "lender");

  const onBorrowedPageChanged = (p: number) => {
    setBorrowedStart((p - 1) * PAGINATION_OPTION.limit);
  }

  const onLentPageChanged = (p: number) => {
    setLentStart((p - 1) * PAGINATION_OPTION.limit);
  }

  return (
    <>
      <TableTitleWrapper>
        <Stack direction="row" sx={{ alignItems: "center" }} gap={2}>
          <PageTitle>I'm borrowing</PageTitle>
          <Refresh onRefresh={refreshBorrowedOrders} />
        </Stack>
      </TableTitleWrapper>

      <OrderTable orders={borrowedOrders} total={borrowedOrdersTotal} isLoading={isBorrowedOrdersLoading} onPageChanged={onBorrowedPageChanged} />

      <TableTitleWrapper>
        <Stack direction="row" sx={{ alignItems: "center" }} gap={2}>
          <PageTitle>I'm lending</PageTitle>
          <Refresh onRefresh={refreshLentOrders} />
        </Stack>
      </TableTitleWrapper>

      <OrderTable orders={lentOrders} total={lentOrdersTotal} isLoading={isLentOrdersLoading} onPageChanged={onLentPageChanged} />

      <SocialGroup />
    </>
  );
}

export default MyOrdersPage;
