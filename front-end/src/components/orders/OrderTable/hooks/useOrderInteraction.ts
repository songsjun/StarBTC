import { useUserIsOrderTaker } from "@services/orders/hooks/ownership/useOrderTaker";
import { useUserIsOrderBorrower } from "@services/orders/hooks/ownership/useUserIsOrderBorrower";
import { useUserIsOrderLender } from "@services/orders/hooks/ownership/useUserIsOrderLender";
import { LoanOrder, LoanOrderStatus, LoanOrderType } from "@services/orders/model/loan-order";
import { useBehaviorSubject } from "@services/ui-ux/hooks/useBehaviorSubject";
import { useEffect, useState } from "react";

/**
 * Tells whether an order can be interacted with by the active user.
 * Interacted meaning, user can do something after opening the order modal dialog.
 * The main goal is to gray out order rows user are not interested in.
 */
export const useOrderInteraction = (order: LoanOrder) => {
  const [canInteract, setCanInteract] = useState(false);
  const orderStatus = useBehaviorSubject(order?.status$);
  // const userIsCreator = useUserIsOrderCreator(order);
  const userIsTaker = useUserIsOrderTaker(order);
  const userIsBorrower = useUserIsOrderBorrower(order);
  const userIsLender = useUserIsOrderLender(order);

  useEffect(() => {
    if (!order || order.type !== LoanOrderType.LENDING) // NOTE: Only LENDING supported for now
      setCanInteract(undefined);
    else {
      switch (orderStatus) {
        case LoanOrderStatus.CREATED:
          // Order not taken yet, everyone can interact with it (to take or cancel)
          setCanInteract(true);
          break;
        case LoanOrderStatus.TAKEN:
          // Order is taken and awaiting BTC transfer. 
          // Only taker can act.
          // TODO: expired order, creator can cancel
          setCanInteract(userIsTaker);
          break;
        case LoanOrderStatus.LENDER_PROOF_SUBMITTED:
          setCanInteract(userIsLender);
          break
        case LoanOrderStatus.BORROWER_PROOF_SUBMITTED:
        case LoanOrderStatus.BORROWER_PAYMENT_CONFIRMED:
        case LoanOrderStatus.LENDER_PAYMENT_CONFIRMED:
        // TODO: Probably need some refinements here, not that simple - especially based on the 2 timelocks.
        case LoanOrderStatus.BORROWED:
          // Order is taken, BTCs are locked and proven.
          // For now only borrower can act, to repay. 
          // TODO: creator, in case repayment did not happen on time.
          setCanInteract(userIsBorrower);
          break;
        case LoanOrderStatus.REPAID:
          setCanInteract(userIsLender);
          break;
        case LoanOrderStatus.ARBITRATION_REQUESTED:
        case LoanOrderStatus.CLOSED:
          // All finished, nobody can interact
          setCanInteract(false);
          break;
        default:
          // What's going on?
          setCanInteract(undefined);
      }
    }
  }, [order, orderStatus, userIsBorrower, userIsTaker, userIsLender]);

  return { canInteract };
}