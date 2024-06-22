import { useCallback, useEffect, useState } from "react";
import { useInterval } from "react-use";
import { LoanOrder, LoanOrderVerificationStatus } from "../model/loan-order";
import { useOrderContract } from "../order-contract/useOrderContract";

/**
 * Returns the latest verification status (BTC payment proof) for the borrower payment (BTC sent to the lock script).
 * If the order proof is being verified, this hook repeatingly poll
 * for latest status
 */
export const useOrderBorrowerVerificationStatus = (order: LoanOrder): LoanOrderVerificationStatus => {
  const { getToLenderTransferZkpStatus } = useOrderContract(order);
  const [status, setStatus] = useState<LoanOrderVerificationStatus>(undefined);

  const checkStatus = useCallback(async () => {
    try {
      const _status = await getToLenderTransferZkpStatus();
      setStatus(LoanOrder.contractVerificationStatusToLocalStatus(_status));
    }
    catch (e) {
      console.warn("getBorrowerPledgeZkStatus() failure", e);
    }
  }, [getToLenderTransferZkpStatus]);

  useInterval(() => {
    checkStatus();
  }, 5000);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return status;
}

/**
 * Returns the latest verification status (BTC payment proof) for the lender unlock payment (Unlock script BTC transaction
 * signed by borrower+lender published).
 * If the order proof is being verified, this hook repeatingly poll
 * for latest status
 */
export const useOrderLenderVerificationStatus = (order: LoanOrder): LoanOrderVerificationStatus => {
  const { getRegularUnlockTransferZkpStatus } = useOrderContract(order);
  const [status, setStatus] = useState<LoanOrderVerificationStatus>(undefined);

  const checkStatus = useCallback(async () => {
    try {
      const _status = await getRegularUnlockTransferZkpStatus();
      setStatus(LoanOrder.contractVerificationStatusToLocalStatus(_status));
    }
    catch (e) {
      console.warn("getLenderPledgeZkStatus() failure", e);
    }
  }, [getRegularUnlockTransferZkpStatus]);

  useInterval(() => {
    checkStatus();
  }, 5000);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return status;
}