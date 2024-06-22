import { NetworkMode } from "@services/network/network";
import { TokenOrNative } from "@services/tokens/token-or-native";

export type ChainConfig = {
  name: string; // Displayable chain name
  rpcs: string[]; // List of chain RPC endpoints
  explorers: string[]; // List of block explorer API endpoints
  chainId: number; // eg: 21 for elastos testnet
  networkMode: NetworkMode; // This chain config only works for the given network mode
  subgraph: {
    endpoint: string;
  }
  nativeCurrency: {
    name: string; // eg: "Elastos"
    symbol: string; // eg: "ELA"
    decimals: number; // eg: 18
    wrappedAddress: string; // eg: Address of Wrapped ELA on ESC
  },
  contracts: {
    orderFactory: string; // Address of the root factory used to create orders
    multicall3: string; // Address of a multicall3 contract to aggregate contract calls
    btcOracle: string; // Address of the BTC orable (save block height vs merkle root) contract
    interest: string; // Address of the Interest contract used by loans/orders to compute loan interests
    arbitrator: string; // Address of the Arbitrator contract used by loans/orders to solve borrower/lender conflicts
  },
  // List of supported tokens for deposits
  tokens: TokenOrNative[];
}