import { etherToStdBigNumber } from "@services/evm/bignumbers";
import { useReadOnlyOrderFactoryContractInstance } from "@services/orders/loan-contract/useOrderFactoryContractInstance";
import { useTokenFromSymbol } from "@services/tokens/hooks/useTokenFromSymbol";
import { tokenToReadableValue } from "@services/tokens/tokens";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { useInterval } from "react-use";
import { BehaviorSubject } from "rxjs";

/**
 * List of a few native coins' latest prices in USD
 */
type EssentialsApiPricing = {
  "timestamp": number; // Last price update timestamp in ms. eg: 1708657172269,
  [coinSymbolUppercase: string]: number; // eg: BTC: 55000.34
}

const REFRESH_PRICES_INTERVAL = 30000; // Refresh prices from the api ervery N ms.
const pricingCache$ = new BehaviorSubject<EssentialsApiPricing | undefined>(undefined);

const updatePrices = async () => {
  try {
    const response = await axios.get(`https://essentials-api.elastos.io/api/v1/price`)
    if (response?.data) {
      pricingCache$.next(response.data);
    }
  }
  catch (e) {
    console.error("Fetch coin pricing error:", e);
  }
}

// Start the permanent price refresh loop
setInterval(async () => { updatePrices(); }, REFRESH_PRICES_INTERVAL);

// Initial price update
updatePrices();

/**
 * Note: this hook now gets price information from the asset oracle on chain, instead of
 * using Essentials API.
 */
export const useCoinPrice = (symbol: string | undefined) => {
  const token = useTokenFromSymbol(symbol);
  const [price, setPrice] = useState<number>(undefined);
  const { getAssetPrice } = useReadOnlyOrderFactoryContractInstance();
  useInterval(() => refreshPrice(), REFRESH_PRICES_INTERVAL);

  const refreshPrice = useCallback(async () => {
    if (!token) {
      setPrice(undefined);
      return;
    }

    try {
      const price = await getAssetPrice(token.wrappedAddress || token.contractAddress);
      // Note: all prices are encoded in 18 decimals in the asset contract.
      const readablePrice = tokenToReadableValue(etherToStdBigNumber(price), 18);
      setPrice(readablePrice?.toNumber());
    }
    catch (e) {
      setPrice(undefined);
    }
  }, [getAssetPrice, token]);

  useEffect(() => { refreshPrice() }, [refreshPrice]);

  return price;
}