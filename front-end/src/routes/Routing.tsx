import NotFound from "@pages/NotFound";
import { Suspense, lazy } from "react";
import { Navigate, Route, RouterProvider, createBrowserRouter, createRoutesFromElements } from "react-router-dom";
import { SWRConfig, SWRConfiguration } from "swr";
import { Loading } from "../components";
import { useErrorHandler } from "../contexts";
import { PATH_MY_ORDERS, PATH_ORDERS } from "./paths";

// Lazily load for all app layouts and pages, to increase overall loading speed / reduce memory footprint
const DefaultLayout = lazy(() => import("../layouts/DefaultLayout/DefaultLayout"));
const MarketplaceHomePage = lazy(() => import("../pages/OrdersPage/OrdersPage"));
const MyOrdersPage = lazy(() => import("../pages/Me/MyOrdersPage/MyOrdersPage"));
const TestsPage = lazy(() => import("../pages/Tests/TestsPage"));

export const Routing = () => {
  const { handleError } = useErrorHandler();

  const swrConfig: SWRConfiguration = {
    onError: (e) => {
      handleError(e);
    }
  };

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<DefaultLayout />} errorElement={<NotFound />}>
        <Route path="/" element={<Navigate to={PATH_ORDERS} replace />} />
        <Route path={PATH_ORDERS} element={<MarketplaceHomePage />} />
        <Route path={PATH_MY_ORDERS} element={<MyOrdersPage />} />
        <Route path="/tests" element={<TestsPage />} />
      </Route>
    )
  );

  return (
    <SWRConfig value={swrConfig}>
      <Suspense fallback={<Loading />}>
        <RouterProvider router={router} />
      </Suspense>
    </SWRConfig>
  );
};
