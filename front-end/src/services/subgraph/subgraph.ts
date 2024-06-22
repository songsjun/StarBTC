/**
 * APIs to fetch orders (asset exchange) contract from the deployed subgraph.
 */

// https://graphnode.filda.io/subgraphs/name/zk-asset-change-esc
// https://graphnode.filda.io/subgraphs/name/zk-asset-change-esc/graphql?query=query+MyQuery+%7B%0A++orders%28skip%3A2%2Cfirst%3A2%29+%7B%0A++++id%0A++++payELA%0A++++buyAmount%0A++++receiveAddress%0A++++status%0A++%7D%0A%7D

import { satsToBtc } from '@services/btc/btc';
import { ChainConfig } from '@services/chains/chain-config';
import { TokenOrNative } from '@services/tokens/token-or-native';
import { getTokenBySymbol } from '@services/tokens/tokens';
import axios from 'axios';
import BigNumber from 'bignumber.js';
import { utils as ethersUtils } from "ethers";

export interface SubgraphOrder {
  id: string;
}

interface FetchOrdersResponse {
  errors?: {
    message: string;
  }[];
  data: {
    orders: SubgraphOrder[];
  }
}

export type SubgraphFilledOrder = {
  tokenAmount: string;
  collateralAmount: string;
  token?: string;
}

interface FetchFilledOrderStatsResponse {
  data: {
    orders: SubgraphFilledOrder[];
  }
}

interface FetchLockBTCOrdersResponse {
  data: {
    orders: {
      collateralAmount: string;
    }[];
  }
}

export enum OrderStatusFilter {
  ALL, // Show all orders
  OPEN, // Show only open orders
  ON_GOING // Show order that are neither open nor closed (in between, processing)
}

/**
 * Fetch orders from the subgraph. Returns orders are the ones from contracts events and do not contain
 * all orders data. In order to get all orders details, getOrder() must be called on the contract directly.
 *
 * @param borrower if given, results are filtered for the given address
 * @param lender if given, results are filtered for the given address
 */
export const fetchOrders = async (chain: ChainConfig, start: number, limit: number, borrower?: string, lender?: string, status: OrderStatusFilter = OrderStatusFilter.ALL, depositedToken: TokenOrNative = null): Promise<{ orders: SubgraphOrder[], total: number }> => {
  const lowercaseBorrower = borrower?.toLowerCase();
  const lowercaseLender = lender?.toLowerCase();

  // Graqhql doesn't actually take JSON, it takes objects without quote for non-string parameters, so we manually build the query string
  let whereQuery: string = "";
  if (borrower || lender) {
    if (borrower && lender)
      whereQuery += ` or: [{ borrower_: { id: "${lowercaseBorrower}" } }, { lender_: { id: "${lowercaseLender}" } }]`;
    else if (borrower)
      whereQuery += ` borrower_: { id: "${lowercaseBorrower}" }`;
    else
      whereQuery += ` lender_: { id: "${lowercaseLender}" }`;
  }

  if (status === OrderStatusFilter.OPEN)
    whereQuery += ` status: "CREATED"`;
  else if (status === OrderStatusFilter.ON_GOING)
    whereQuery += ` status_not_in: [CREATED, CLOSED]`;

  if (depositedToken) {
    whereQuery += ` token:"${depositedToken.contractAddress.toLowerCase()}"`;
  }

  let whereClause: string = !whereQuery ? "" : `where: { ${whereQuery} }`;

  try {
    const resultsPerPage = 1000;
    let startAt = 0;
    let pageOrders: SubgraphOrder[] = [];
    let total: number = 0;

    while (true) {
      // NOTE: because the graph pagination capabilities are not great (haven't found a way to get the total number of results, with a where clause,
      // while returning only a few results), we just get ALL results every time for now and only return a cut to the caller.
      const query = `query FetchOrders {
        orders(
          skip: ${startAt}
          first:${resultsPerPage}
          orderBy: createdAt,
          orderDirection: desc
          ${whereClause}
        ) { id createdAt status lender { id } lenderBTCAddress borrower { id } borrowerBTCAddress }
      }`;

      const response = await axios.post<FetchOrdersResponse>(chain.subgraph.endpoint, { query }, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.data?.errors?.length > 0) {
        for (const error of response.data.errors)
          console.error("Subgraph error:", new Error(error?.message));
      }
      if (!pageOrders)
        return { orders: undefined, total: undefined };

      const data = response?.data?.data;
      pageOrders.push(...(data?.orders || []));
      total += pageOrders?.length || 0;

      if (pageOrders.length < resultsPerPage) {
        // No more page to fetch
        break;
      }

      startAt += resultsPerPage;
    }

    const orders = pageOrders.slice(start, start + limit);

    return { orders, total };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return undefined;
  }
}

export const fetchAllFilledOrdersStats = async (chain: ChainConfig) => {
  const usdtToken = getTokenBySymbol(chain, "USDT");
  const usdcToken = getTokenBySymbol(chain, "USDC");

  try {
    const resultsPerPage = 1000;
    let startAt = 0;
    let usdtSum: number = 0;
    let usdcSum: number = 0;
    let btcSum: number = 0;

    const query = `query FetchFilledOrders {
      orders(skip: ${startAt} first:${resultsPerPage} where: { status_in: [CLOSED]}) { id status tokenAmount token collateralAmount }
    }`;

    // Loop over pagination, max 1000 results every time
    while (true) {
      const response = await axios.post<FetchFilledOrderStatsResponse>(chain.subgraph.endpoint, { query }, {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = response?.data?.data;
      const orders = data?.orders;

      if (!orders)
        return { btcSum, usdtSum, usdcSum };

      for (const order of orders) {
        if (order.token.toLowerCase() === usdtToken.contractAddress.toLowerCase())
          usdtSum += new BigNumber(ethersUtils.formatUnits(order.tokenAmount, usdtToken.decimals)).toNumber();
        else if (order.token.toLowerCase() === usdcToken.contractAddress.toLowerCase())
          usdcSum += new BigNumber(ethersUtils.formatUnits(order.tokenAmount, usdcToken.decimals)).toNumber();
        else
          console.warn(`fetchAllFilledOrdersStats(): unhandled ERC20 token ${order.token}`);

        btcSum += satsToBtc(order.collateralAmount).toNumber();
      }

      if (orders.length < resultsPerPage) {
        // No more page to fetch
        break;
      }

      startAt += resultsPerPage;
    }

    return { usdtSum, usdcSum, btcSum };
  } catch (error) {
    console.error("Error fetching filled orders:", error);
    return undefined;
  }
}

/**
 * Retrieves the number of BTC locked in orders (loan collateral), for a given address.
 */
export const fetchLockedBTC = async (chain: ChainConfig, btcAddress: string) => {
  try {
    const resultsPerPage = 1000;
    let startAt = 0;
    let lockedBTCAmount: number = 0;

    const query = `query FetchLockedBTCOrders {
      orders(skip: ${startAt} first:${resultsPerPage} where: { borrowerBTCAddress: "${btcAddress}" status_in: [TAKEN, BORROWER_PROOF_SUBMITTED, BORROWED, REPAID, LENDER_PROOF_SUBMITTED, ARBITRATION_REQUESTED]}) { id collateralAmount }
    }`;

    // Loop over pagination, max 1000 results every time
    while (true) {
      const response = await axios.post<FetchLockBTCOrdersResponse>(chain.subgraph.endpoint, { query }, {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = response?.data?.data;
      const orders = data?.orders;

      if (!orders)
        return { totalCollateralAmount: lockedBTCAmount };

      for (const order of orders) {
        lockedBTCAmount += satsToBtc(order.collateralAmount).toNumber();
      }

      if (orders.length < resultsPerPage) {
        // No more page to fetch
        break;
      }

      startAt += resultsPerPage;
    }

    return { lockedBTCAmount };
  } catch (error) {
    console.error("Error fetching locked btc orders:", error);
    return undefined;
  }
}