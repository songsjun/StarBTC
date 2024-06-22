const emptyAddress = "0x" + "0".repeat(32);
const emptyHash = "0x" + "0".repeat(64);

/**
 * Tells if the given transaction hash is either null, or 0x0000... (empty)
 */
export const isNullOrEmptyTransactionHash = (txHash: string): boolean => {
  if (!txHash)
    return true;

  return txHash.toLowerCase() === emptyHash.toLowerCase();
}

export const isNullOrEmptyAddress = (address: string): boolean => {
  if (!address)
    return true;

  return address.toLowerCase().startsWith(emptyAddress.toLowerCase());
}