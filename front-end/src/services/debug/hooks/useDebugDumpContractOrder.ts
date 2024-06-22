import { useOrderLockScriptMethods } from "@services/orders/hooks/useOrderLockScript";
import { LoanOrder } from "@services/orders/model/loan-order";
import { useOrderContract } from "@services/orders/order-contract/useOrderContract";
import { useOrderData } from "@services/orders/order-contract/useOrderData";
import { scriptTimelockToSeconds } from "@services/orders/timelocks";
import { displayableZKPStatus } from "@services/orders/zkp";
import { sha256 } from "@utils/crypto/sha256";
import { useCallback } from "react";

/**
 * Dumps chain info about an order
 */
export const useDebugDumpContractOrder = (order: LoanOrder) => {
  const { fetchOrderData } = useOrderData();
  const { buildScriptInfo } = useOrderLockScriptMethods(order);
  const { getToLenderTransferZkpStatus, getRegularUnlockTransferZkpStatus } = useOrderContract(order);

  // raw order

  const dumpContractOrder = useCallback(async () => {
    console.log("Fetching raw order:", order.id.toString());
    const orderData = await fetchOrderData(order.id);
    if (!orderData)
      return;

    console.log("ORDER DATA (contract):", orderData);
    console.log("LOAN ORDER (app):", order);

    const scriptInfo = await buildScriptInfo();
    console.log("SCRIPT:", scriptInfo?.script);
    console.log("SCRIPT ADDRESS:", scriptInfo?.address);

    if (order.preImage != "") {
      console.log("PREIMAGE:", order.preImage);
      console.log("PREIMAGE HASH:", sha256(Buffer.from(order.preImage, "hex")).toString("hex"));
    }

    const toLenderZKPStatus = await getToLenderTransferZkpStatus();
    console.log("To lender ZKP status:", displayableZKPStatus(LoanOrder.contractVerificationStatusToLocalStatus(toLenderZKPStatus)));

    const regularUnlockZKPStatus = await getRegularUnlockTransferZkpStatus();
    console.log("Regular unlock ZKP status:", displayableZKPStatus(LoanOrder.contractVerificationStatusToLocalStatus(regularUnlockZKPStatus)));

    const lock1Secs = scriptTimelockToSeconds(order.lockTime1);
    const lock1Days = lock1Secs / 60 / 60 / 24;
    console.log("locktime1 duration:", lock1Secs, "seconds,", lock1Days, "days");

    const lock2Secs = scriptTimelockToSeconds(order.lockTime2);
    const lock2Days = lock2Secs / 60 / 60 / 24;
    console.log("locktime2 duration:", lock2Secs, "seconds,", lock2Days, "days");
  }, [buildScriptInfo, fetchOrderData, getRegularUnlockTransferZkpStatus, getToLenderTransferZkpStatus, order]);

  return { dumpContractOrder }
}