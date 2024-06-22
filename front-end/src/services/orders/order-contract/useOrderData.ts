import { Order } from "@contracts/types";
import { etherToStdBigNumber } from "@services/evm/bignumbers";
import { useMulticall3 } from "@services/multicall/hooks/useMulticall3";
import { OrderData } from "@services/orders/model/order-data";
import { useCallback } from "react";
import { useOrderContractInstance } from "./useOrderContractInstance";

type MulticallInputEntry = {
  key: string;
  callData: string;
}

export const useOrderData = () => {
  const { singleContractMulticall } = useMulticall3();
  const { getReadOnlyInstance } = useOrderContractInstance();

  const decodedMulticallResult = (contractInstance: Order, key: string, multicallInputSet: MulticallInputEntry[], multicallOutputs: string[]) => {
    const outputIndex = multicallInputSet.findIndex(i => i.key === key);
    return contractInstance.interface.decodeFunctionResult(key as any, multicallOutputs[outputIndex]);
  }

  const fetchOrderData = useCallback(async (orderId: string): Promise<OrderData> => {
    const contractInstance = getReadOnlyInstance(orderId);

    // Must be one of the keys supported by "contractInstance.interface.encodeFunctionData(xxx)" - no typescript type found for it
    const contractFields = [
      "orderType", "status", "limitedDays",
      "token", "tokenAmount", "interestRate", "interestValue", "collateralAmount",
      "lender", "lenderPublicKey", "preImage", "preImageHash",
      "borrower", "borrowerBtcAddress", "borrowerPublicKey",
      "createTime", "takenTime", "borrowedTime", "borrowerProofTime", "borrowerRepaidTime", "lenderManuallyConfirmBTCTime", // action timestamps
      "takenExpireTime", "submitProofExpirationTime", "borrowExpirationTime", "repaidExpireTime", // expiration durations
      "toLenderBtcTx", "toBorrowerBtcTx", "repaySignature", "repayBtcRawData",
      "borrowerConfirmRewardsTips", "lenderConfirmRewardsTips",
      "lockTime1", "lockTime2"
    ];

    const multicallInputSet: MulticallInputEntry[] = contractFields.map(f => ({
      key: f,
      callData: contractInstance.interface.encodeFunctionData(f as any)
    }))

    const data = await singleContractMulticall(orderId, multicallInputSet.map(i => i.callData));

    let toLenderBtcTx; // Type: TaprootTransaction
    try { toLenderBtcTx = decodedMulticallResult(contractInstance, "toLenderBtcTx", multicallInputSet, data) } catch (e) { }

    let toBorrowerBtcTx; // Type: TaprootTransaction
    try { toBorrowerBtcTx = decodedMulticallResult(contractInstance, "toBorrowerBtcTx", multicallInputSet, data) } catch (e) { }

    // TEMP COMPATIBILITY NEW ORDERS - MOVE WHEN FACTORY ADDRESS CHANGES
    let lenderManuallyConfirmBTCTime;
    try {
      lenderManuallyConfirmBTCTime = etherToStdBigNumber(decodedMulticallResult(contractInstance, "lenderManuallyConfirmBTCTime", multicallInputSet, data)?.[0])?.toNumber();
    } catch (e) { }

    let submitProofExpirationTime;
    try {
      submitProofExpirationTime = etherToStdBigNumber(decodedMulticallResult(contractInstance, "submitProofExpirationTime", multicallInputSet, data)?.[0])?.toNumber();
    } catch (e) { }

    let borrowExpirationTime;
    try {
      borrowExpirationTime = decodedMulticallResult(contractInstance, "borrowExpirationTime", multicallInputSet, data)?.[0];
    } catch (e) { }

    const orderData: OrderData = {
      // Initial data
      id: orderId,
      type: decodedMulticallResult(contractInstance, "orderType", multicallInputSet, data)?.[0],
      token: decodedMulticallResult(contractInstance, "token", multicallInputSet, data)?.[0],
      tokenAmount: etherToStdBigNumber(decodedMulticallResult(contractInstance, "tokenAmount", multicallInputSet, data)?.[0]),
      collateralAmount: etherToStdBigNumber(decodedMulticallResult(contractInstance, "collateralAmount", multicallInputSet, data)?.[0]),
      lender: decodedMulticallResult(contractInstance, "lender", multicallInputSet, data)?.[0],
      lenderPublicKey: decodedMulticallResult(contractInstance, "lenderPublicKey", multicallInputSet, data)?.[0].slice(2),
      borrower: decodedMulticallResult(contractInstance, "borrower", multicallInputSet, data)?.[0],
      borrowerBtcAddress: decodedMulticallResult(contractInstance, "borrowerBtcAddress", multicallInputSet, data)?.[0],
      borrowerPublicKey: decodedMulticallResult(contractInstance, "borrowerPublicKey", multicallInputSet, data)?.[0].slice(2),
      limitedDays: decodedMulticallResult(contractInstance, "limitedDays", multicallInputSet, data)?.[0].toNumber(),
      interestRate: decodedMulticallResult(contractInstance, "interestRate", multicallInputSet, data)?.[0],
      interestValue: etherToStdBigNumber(decodedMulticallResult(contractInstance, "interestValue", multicallInputSet, data)?.[0]),
      lockTime1: decodedMulticallResult(contractInstance, "lockTime1", multicallInputSet, data)?.[0].toNumber(),
      lockTime2: decodedMulticallResult(contractInstance, "lockTime2", multicallInputSet, data)?.[0].toNumber(),
      lenderConfirmRewardsTips: etherToStdBigNumber(decodedMulticallResult(contractInstance, "lenderConfirmRewardsTips", multicallInputSet, data)?.[0]),
      borrowerConfirmRewardsTips: etherToStdBigNumber(decodedMulticallResult(contractInstance, "borrowerConfirmRewardsTips", multicallInputSet, data)?.[0]),

      // Dynamic data (set while progressing in the order)
      status: decodedMulticallResult(contractInstance, "status", multicallInputSet, data)?.[0],
      toLenderBtcTx: { wTxId: toLenderBtcTx?.[0]?.slice(2), txId: toLenderBtcTx?.[1]?.slice(2) },
      toBorrowerBtcTx: { wTxId: toBorrowerBtcTx?.[0]?.slice(2), txId: toBorrowerBtcTx?.[1]?.slice(2) },
      repaySignature: decodedMulticallResult(contractInstance, "repaySignature", multicallInputSet, data)?.[0].slice(2),
      preImage: decodedMulticallResult(contractInstance, "preImage", multicallInputSet, data)?.[0].slice(2),
      preImageHash: decodedMulticallResult(contractInstance, "preImageHash", multicallInputSet, data)?.[0].slice(2),
      repayBtcRawData: decodedMulticallResult(contractInstance, "repayBtcRawData", multicallInputSet, data)?.[0],

      // State change timestamps
      createTime: etherToStdBigNumber(decodedMulticallResult(contractInstance, "createTime", multicallInputSet, data)?.[0])?.toNumber(),
      takenTime: etherToStdBigNumber(decodedMulticallResult(contractInstance, "takenTime", multicallInputSet, data)?.[0])?.toNumber(),
      borrowerProofTime: etherToStdBigNumber(decodedMulticallResult(contractInstance, "borrowerProofTime", multicallInputSet, data)?.[0])?.toNumber(),
      borrowedTime: etherToStdBigNumber(decodedMulticallResult(contractInstance, "borrowedTime", multicallInputSet, data)?.[0])?.toNumber(),
      borrowerRepaidTime: etherToStdBigNumber(decodedMulticallResult(contractInstance, "borrowerRepaidTime", multicallInputSet, data)?.[0])?.toNumber(),
      lenderManuallyConfirmBTCTime,

      // Expiration durations
      takenExpireTime: decodedMulticallResult(contractInstance, "takenExpireTime", multicallInputSet, data)?.[0],
      submitProofExpirationTime,
      repaidExpireTime: decodedMulticallResult(contractInstance, "repaidExpireTime", multicallInputSet, data)?.[0],
      borrowExpirationTime
    };

    return orderData;
  }, [getReadOnlyInstance, singleContractMulticall]);

  return { fetchOrderData }
}