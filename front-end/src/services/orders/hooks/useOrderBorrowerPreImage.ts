import { useEVMWallet } from "@services/evm/hooks/useEVMWallet";
import { LoanOrder } from "@services/orders/model/loan-order";
import { sha256 } from "@utils/crypto/sha256";
import moment from "moment";
import { useCallback } from "react";
import { utils } from "web3";

/**
 * Generates the "preimage" (raw + hash) required by the order contract when a borrower takes a loan.
 * This preimage is a secret code that can be used to unlock funds. In order to produce a deterministic
 * preimage that can be rebuilt from another browser without depending on the local storage (we can't rely on local storage
 * to recover funds, in case browser is cleared), we sign the order address (unique) and order creation date with user's EVM wallet.
 */
export const useOrderBorrowerPreImage = (order: LoanOrder) => {
  const { signDataV4 } = useEVMWallet();

  const generatePreImage = useCallback(async (): Promise<{ preImage: string; preImageHash: string }> => {
    // We use eth_signTypedData_v4 for human-readable signatures
    const domain = { name: "BeL2-Loan", version: "1" };

    const types = {
      Message: [
        { name: "order", type: "string" },
        { name: "creationDate", type: "string" },
      ],
    };

    const value = {
      order: utils.toChecksumAddress(order.id),
      creationDate: moment(order.createdAt).format("YYYY-MM-DD HH:mm")
    }

    const prefixedPreImage = await signDataV4(domain, types, value);
    if (!prefixedPreImage)
      return undefined;

    // Remove the 0x prefix from the EVM wallet signature, we actually just want a random but deterministic hex signature payload.
    const preImage = prefixedPreImage.slice(2);

    return {
      preImage,
      preImageHash: sha256(Buffer.from(preImage, "hex")).toString("hex")
    }
  }, [order, signDataV4]);

  return { generatePreImage };
}