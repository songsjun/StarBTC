/**
 * Blockstream BTC Services
 */

import { isValidBtcTransactionHash } from "@services/btc/btc";
import { isMainnetNetworkInUse } from "@services/network/network";
import axios from "axios";

const mainnetApi = 'https://blockstream.info/api';
const testnetApi = 'https://blockstream.info/testnet/api'

const apiPost = async <T>(url: string, data: string): Promise<T> => {
  const response = await axios({ method: "POST", url, data });
  return response?.data;
}

const api = () => {
  return isMainnetNetworkInUse() ? mainnetApi : testnetApi;
}

/**
 * Publishes a signed bitcoin transaction on chain, to get mined.
 * 
 * @returns The transaction ID
 */
export const publishBitcoinTransaction = async (transactionHex: string): Promise<string> => {
  try {
    let requestUrl = `${api()}/tx`;
    const txIdOrError = await apiPost<string>(requestUrl, transactionHex);
    console.log("publishBitcoinTransaction result:", txIdOrError);

    if (isValidBtcTransactionHash(txIdOrError))
      return txIdOrError;
    else {
      throw new Error(txIdOrError);
    }
  }
  catch (err) {
    console.error('Blockstream: failed to publish transaction:', err);
    return null;
  }
}
