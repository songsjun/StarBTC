import { btcToSats } from "@services/btc/btc";
import { estimateBTCFeeRate } from "@services/mempool-api/mempool-api";
import { isMainnetNetworkInUse } from "@services/network/network";
import { getUTXOs } from "@services/nownodes-api/nownodes-api";
import { Transaction, networks, payments } from "bitcoinjs-lib";
import { useCallback, useEffect, useState } from "react";
import { LockScriptTransactionPurpose, createBitcoinTransactionForLoanScript } from "../btc-tx";
import { LoanOrder } from "../model/loan-order";
import { useOrderContract } from "../order-contract/useOrderContract";

export type LockScriptInfo = {
  script: string;
  address: string;
}

export const useOrderLockScript = (order: LoanOrder) => {
  const [scriptInfo, setScriptInfo] = useState<LockScriptInfo>(undefined);
  const { buildScriptInfo } = useOrderLockScriptMethods(order);

  useEffect(() => {
    buildScriptInfo().then(setScriptInfo);
  }, [buildScriptInfo]);

  return scriptInfo;
}

export const useOrderLockScriptMethods = (order: LoanOrder) => {
  const { getLoanScript } = useOrderContract(order);

  const buildScriptInfo = useCallback(async (): Promise<LockScriptInfo> => {
    // Get the btc script from the contract, and compute the script address locally
    try {
      console.log("Getting loan script");
      const script = await getLoanScript();
      console.log("script", script);

      if (!script || script === "") {
        return { script: undefined, address: undefined };
      }

      //  Get P2WSH address
      const p2wsh = payments.p2wsh({ redeem: { output: Buffer.from(script, "hex"), network: isMainnetNetworkInUse() ? networks.bitcoin : networks.testnet } });
      const address = p2wsh.address;

      return { script, address };
    }
    catch (e) {
      // Catch potential errors, as for now the order contract returns an invalid script when it can't actually build one.
      console.warn("buildScriptInfo() error:", e);
      return { script: undefined, address: undefined };
    }
  }, [getLoanScript]);

  const buildScriptTransaction = useCallback(async (purpose: LockScriptTransactionPurpose, includeWitnesses: boolean, scriptInfo: LockScriptInfo, outputAddress: string, lockTime1: number, lockTime2: number, borrowerDerUnlockSignature: string = null, lenderDerUnlockSignature: string = null, preImage: string = null): Promise<Transaction> => {
    // Retrieve the first and unique UTXO of the unlock script address
    const scriptUTXOs = await getUTXOs(scriptInfo.address);
    if (!scriptUTXOs?.length)
      throw new Error(`Something's wrong. Unlock script has no UTXO, check what's going on.`);

    if (scriptUTXOs.length > 1)
      console.error(`Something's wrong. Unlock script has more than one UTXO, this is abnormal. Other utxos will be lost in the script, check what's going on.`);

    let satsPerVb = await estimateBTCFeeRate();
    if (!satsPerVb)
      throw new Error(`buildScriptTransaction(): Failed to estimate bitcoin gas cost`);

    // IMPORTANT:
    // The gas cost is put in the tx when the borrower repays the loan. Which is at a different time from when the lender unlocks the BTC 
    // script. For the HK demo (2024.05), in order to avoid any issue because gas cost would have increased in between, we double the estimation.
    // This has to be improved later by using parent-child transaction by the borrower in case tx is stuck for too long.
    satsPerVb = satsPerVb * 2;

    // TMP
    satsPerVb = isMainnetNetworkInUse() ? 35 : 200;

    const outputValueSat = btcToSats(order.collateralAmount).toNumber();
    const inputUTXO = scriptUTXOs[0]; // Only UTXO owned by the script address
    const rawBtcTx = createBitcoinTransactionForLoanScript(
      purpose,
      includeWitnesses,
      inputUTXO,
      scriptInfo.script,
      outputAddress,
      borrowerDerUnlockSignature,
      lenderDerUnlockSignature,
      outputValueSat,
      preImage,
      satsPerVb,
      lockTime1,
      lockTime2
    );

    return rawBtcTx;
  }, [order]);

  return {
    buildScriptInfo,
    buildScriptTransaction
  };
}