export type TokenOrNative = {
  isNative: boolean;
  symbol: string; // ELA, USDT
  wrappedAddress?: string; // For native tokens, their wrapped version on the EVM
  contractAddress?: string; // ERC20 contract address, if not native
  icon?: string; // data url of the token logo
  decimals?: number; // For ERC20 tokens, number of contract decimals
  displayDecimals: number; // Number of decimals to use before truncating for clearer display.
  minPlaceAmount?: number; // Minimum number of tokens user can input when placing an order.
  maxPlaceAmount?: number; // Maximum number of tokens user can input when placing an order.
  canPlaceOrders: boolean; // Whether orders can be created with this token as maker token.
}
