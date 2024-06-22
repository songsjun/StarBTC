import { getAddressInfo, getTransactionDetails } from "@services/nownodes-api/nownodes-api";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import { useInterval } from "react-use";
import { fullBTCTransactionToWTxId } from "../btc";

/**
 * Periodically checks a target bitcoin address to know when a payment has been received. 
 * WHen received, returns txid and wtxid.
 * 
 * NOTE: set monitoredAddress to undefined to avoid permanent API polling.
 * 
 * @param monitoredAddress address monitored for transaction, but also as output address that should receive the transfer
 * @param fromAddress address of the sender (in utxo) that must provide the given satAmount amount.
 * @param satAmount output amount the monitoredAddress should receive in this transaction. Pass null to NOT check any amount.
 */
export const useCheckReceivedTransfer = (monitoredAddress: string, fromAddress: string, satAmount: number, notOlderThan: Date) => {
  const [txId, setTxId] = useState<string>(undefined);
  const [wTxId, setWTxId] = useState<string>(undefined);
  let isMounted = true;

  const checkReceivedTransfer = useCallback(async () => {
    let _txId: string = undefined;
    let _wTxId: string = undefined;

    // We've already found the transfer, don't fetch again.
    if (txId)
      return;

    if (monitoredAddress) {
      const addressInfo = await getAddressInfo(monitoredAddress);
      if (addressInfo && addressInfo.txids) {
        // Transaction ids are sorted by most recent first. Run through them one by one to get tx details.
        // Stop when a transaction is older than given limit date
        for (const checkedTxId of addressInfo.txids) {
          const txDetails = await getTransactionDetails(checkedTxId);
          console.log("txDetails", txDetails);

          // Stop checking this tx and other older txs in case of api error or if current tx is too old.
          if (!txDetails || moment.unix(txDetails.blockTime).isBefore(notOlderThan))
            break;

          // Need at least one confirmation, tx in mempool doesn't count
          if (txDetails.confirmations == 0)
            break;

          // Check if fromAddress is in the input utxos
          if (!txDetails.vin.find(vin => vin.addresses.find(a => a === fromAddress)))
            continue; // continue not break, because the target transaction can be after another transaction in the same block, in case the same user sent BTC for another usage at the same time

          // Check if one of the outputs is the target amount to the monitoredAddress
          const monitoredAddressOutput = txDetails.vout.find(vout => vout.addresses.find(a => a === monitoredAddress));
          if (!monitoredAddressOutput)
            continue;

          if (satAmount === null || parseInt(monitoredAddressOutput.value) == satAmount) {
            // We've found what we were looking for
            _txId = checkedTxId;
            _wTxId = fullBTCTransactionToWTxId(txDetails.hex);
            break;
          }

          if (!isMounted)
            return;
        }
      }
    }

    setTxId(_txId);
    setWTxId(_wTxId);
  }, [fromAddress, isMounted, txId, monitoredAddress, notOlderThan, satAmount]);

  useInterval(checkReceivedTransfer, 30000);

  // Initial check
  useEffect(() => {
    checkReceivedTransfer();
  }, [checkReceivedTransfer]);

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      isMounted = false;
    }
  });

  return {
    txId,
    wTxId
  }
}