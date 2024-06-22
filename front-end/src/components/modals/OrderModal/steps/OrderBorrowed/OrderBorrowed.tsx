import { ErrorLabel } from "@components/base/ErrorLabel/ErrorLabel";
import { SectionIntroText } from "@components/base/SectionIntroText";
import { EnsureWalletNetwork } from "@components/data/EnsureWalletNetwork/EnsureWalletNetwork";
import { WarningDemoButton } from "@components/data/WarningDemoButton/WarningDemoButton";
import { ModalButtonStack } from "@components/modals/ModalButtonStack/ModalButtonStack";
import { LoadingButton } from "@mui/lab";
import { Button } from "@mui/material";
import { btcToSats, rsSignatureToDer } from "@services/btc/btc";
import { useBitcoinPublicKey } from "@services/btc/hooks/useBitcoinPublicKey";
import { useBitcoinWalletAction } from "@services/btc/hooks/useBitcoinWalletAction";
import { useERC20Balance } from "@services/evm/hooks/useERC20Balance";
import { useERC20Contract } from "@services/evm/hooks/useERC20Contract";
import { useEnoughERC20Allowance } from "@services/evm/hooks/useEnoughERC20Allowance";
import { LockScriptTransactionPurpose } from "@services/orders/btc-tx";
import { useOrderRepayExpiration } from "@services/orders/hooks/expirations/useOrderRepayExpiration";
import { useUserIsOrderCreator } from "@services/orders/hooks/ownership/useOrderCreator";
import { useUserIsOrderBorrower } from "@services/orders/hooks/ownership/useUserIsOrderBorrower";
import { useUserIsOrderLender } from "@services/orders/hooks/ownership/useUserIsOrderLender";
import { useLenderTimelock } from "@services/orders/hooks/timelocks/useLenderTimelock";
import { useOrderAutoRefresh } from "@services/orders/hooks/useOrderAutoRefresh";
import { useOrderLockScriptMethods } from "@services/orders/hooks/useOrderLockScript";
import { usePaidBTCOrder } from "@services/orders/hooks/usePaidBTCOrders";
import { useToLenderBtcTx } from "@services/orders/hooks/useToLenderTxId";
import { LoanOrder } from "@services/orders/model/loan-order";
import { useOrderContract } from "@services/orders/order-contract/useOrderContract";
import BigNumber from "bignumber.js";
import { Transaction } from "bitcoinjs-lib";
import { FC, useCallback, useMemo, useState } from "react";
import { MainContentStack } from "../../OrderModal.styles";
import { CancelOrderButton } from "../../components/CancelOrderButton";
import { LenderTimelockUnlockButton } from "../../components/LenderTimelockUnlockButton";
import { OrderDetailsTable } from "../../components/OrderDetailsTable/OrderDetailsTable";

export const OrderBorrowed: FC<{
  order: LoanOrder;
  onClose: () => void;
}> = ({ order, onClose }) => {
  const [submitting, setSubmitting] = useState(false);
  const { borrowerRepayment, refreshOrder } = useOrderContract(order);
  const userIsBorrower = useUserIsOrderBorrower(order);
  const { signScriptData } = useBitcoinWalletAction();
  const { buildScriptInfo, buildScriptTransaction } = useOrderLockScriptMethods(order);
  const repayAmount = useMemo(() => new BigNumber(order.tokenAmount).plus(order.interestValue).plus(order.lenderConfirmRewardsTips), [order]); // Amount to repay is order's tokenAmount + interestValue + tip to lender (if any) - NOTE: For simplicity, "tip" is included in the approval even if not spent by the contract.
  const { contractBalance } = useERC20Balance(order.token.symbol);
  const { enoughAllowance, refreshAllowance } = useEnoughERC20Allowance(order.token.contractAddress, order.id, repayAmount);
  const enoughBalance = contractBalance !== undefined && contractBalance.gte(repayAmount);
  const { approve } = useERC20Contract(order.token.contractAddress);
  const currentPublicKey = useBitcoinPublicKey(); // Bitcoin public key of currently active wallet
  const isBitcoinSamePublicKey = order.borrower.btcPublicKey === currentPublicKey;
  const { transaction } = useToLenderBtcTx(order);
  const isMined = transaction?.confirmations > 0;
  const userIsLender = useUserIsOrderLender(order);
  const lenderTimeUnlockBtcOrder = usePaidBTCOrder(order.id, "lender-time-unlock");
  const userIsCreator = useUserIsOrderCreator(order);
  const { isExpired } = useOrderRepayExpiration(order); // Time after which the borrower cannot repay
  const { exceeded: lenderTimelockExceeded, remainingTime: lenderTimelockRemainingSeconds } = useLenderTimelock(order); // Time after which the lender can unlock borrower's BTC to himself, in case of no repayment. Should be later than the order repay expiration date.

  useOrderAutoRefresh(order);

  /**
  * Publish transaction to increase ERC20 token allowance from user wallet
  * for the order contract.
  */
  const handleApproveSpending = useCallback(async () => {
    setSubmitting(true);
    try {
      await approve(order.id, order.token, repayAmount);
      refreshAllowance();
    }
    catch (e) {
      console.warn("Approve error:", e);
    }
    setSubmitting(false);
  }, [order, approve, repayAmount, refreshAllowance]);

  const handleRepayOrder = useCallback(async () => {
    setSubmitting(true);

    // Build the unlock script and its address
    const scriptInfo = await buildScriptInfo();
    console.log("Script info:", scriptInfo);

    const unsignedBtcTx = await buildScriptTransaction(LockScriptTransactionPurpose.UNSIGNED, false, scriptInfo, order.borrower.btcAddress, order.lockTime1, order.lockTime2);
    console.log("Built script transaction:", unsignedBtcTx);

    // Sign the first part of the BTC unlock tx using essentials. This will be used later combined with lender's signature,
    // or with arbitrage if needed, to unlock the locked BTCs.
    const orderSatsValue = btcToSats(order.collateralAmount).toNumber();
    console.log("Transaction gross sats value:", orderSatsValue);

    const hashForWitness = unsignedBtcTx.hashForWitnessV0(0, Buffer.from(scriptInfo.script, "hex"), orderSatsValue, Transaction.SIGHASH_ALL).toString("hex");
    console.log("hashForWitness", hashForWitness);
    const borrowerSignature = await signScriptData(hashForWitness);
    console.log("R|S borrower signature:", borrowerSignature);

    if (borrowerSignature) {
      // Repay lent tokens to the contract. Tokens remains in contract until the borrowers unlocks (and prooves) lender's BTCs 
      // by publishing the unlock tx on bitcoin.
      const borrowerDerSignature = rsSignatureToDer(borrowerSignature);
      if (await borrowerRepayment(unsignedBtcTx.toHex(), borrowerDerSignature)) {
        await refreshOrder();
      }
    }

    setSubmitting(false);
  }, [buildScriptInfo, buildScriptTransaction, order, signScriptData, borrowerRepayment, refreshOrder]);

  const repayButtonTitle = useMemo(() => {
    if (isBitcoinSamePublicKey) {
      if (enoughBalance)
        return "Repay order";
      else
        return `${repayAmount} ${order.token.symbol} needed`;
    }
    else {
      return "Wrong BTC wallet";
    }
  }, [enoughBalance, isBitcoinSamePublicKey, order, repayAmount]);

  const introText = useMemo(() => {
    if (isExpired || lenderTimelockExceeded)
      return null;

    if (userIsBorrower)
      return "This loan is currently active and you have to repay tokens before the expiration date in order to unlock your locked BTC.";
    else
      return "This loan is currently active and the borrower has received tokens and has locked BTCs. The borrower now has a few days to repay tokens.";
  }, [isExpired, lenderTimelockExceeded, userIsBorrower]);

  const introErrorText = useMemo(() => {
    if (isExpired) {
      if (userIsBorrower)
        return "Unfortunately, you haven't repaid on time. Lender will unlock the BTC for himself.";
      else if (userIsLender) {
        if (!lenderTimelockExceeded)
          return `Borrower has not completed his repayment on time. You will be able to unlock the BTC for yourself ${lenderTimelockRemainingSeconds !== undefined ? "in " + lenderTimelockRemainingSeconds + " seconds" : "after a while"}.`;
        else
          return "Borrower has not completed his repayment on time. You can now unlock the BTC for yourself.";
      }
      else
        return "Borrower has not completed his repayment on time. Lender will unlock the BTC for himself.";
    }
  }, [isExpired, lenderTimelockExceeded, lenderTimelockRemainingSeconds, userIsBorrower, userIsLender]);

  return (
    <>
      <MainContentStack>
        <SectionIntroText>
          {introText}
          {introErrorText && <ErrorLabel>{introErrorText}</ErrorLabel>}
        </SectionIntroText>
        <OrderDetailsTable order={order} />
      </MainContentStack>

      {/* Buttons */}
      <ModalButtonStack>
        <Button
          fullWidth
          size="large"
          variant="outlined"
          disabled={submitting}
          onClick={onClose}>
          Close
        </Button>

        {
          // Repayment expiration not reached, borrower can repay.
          userIsBorrower && isExpired === false &&
          <EnsureWalletNetwork continuesTo="Repay order" evmConnectedNeeded btcAccountNeeded bitcoinSignDataNeeded fullWidth>
            <WarningDemoButton action="Repay order" fullWidth>
              {
                enoughAllowance && <LoadingButton
                  fullWidth
                  size="large"
                  variant="contained"
                  loading={submitting}
                  disabled={!isBitcoinSamePublicKey || !isMined}
                  onClick={handleRepayOrder}>
                  {repayButtonTitle}
                </LoadingButton>
              }
              {
                !enoughAllowance && <LoadingButton
                  fullWidth
                  size="large"
                  variant="contained"
                  loading={submitting}
                  disabled={enoughAllowance === undefined}
                  onClick={handleApproveSpending}
                >
                  Approve spending
                </LoadingButton>
              }
            </WarningDemoButton>
          </EnsureWalletNetwork>
        }
        {
          userIsCreator && lenderTimelockExceeded && lenderTimeUnlockBtcOrder && <CancelOrderButton order={order} onCancelled={onClose} />
        }
        {
          // Lender can time unlock the BTC after timelock1, in case borrower did not repay
          userIsLender && lenderTimelockExceeded && !lenderTimeUnlockBtcOrder &&
          <LenderTimelockUnlockButton order={order} />
        }
      </ModalButtonStack>
    </>)
}