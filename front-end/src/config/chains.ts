import { ChainConfig } from "@services/chains/chain-config";
import { escBtcToken, escTestnetBtcToken, escTestnetUSDTToken, escUSDCToken, escUSDTToken } from "@services/tokens/tokens";

const productionBuild = process.env.REACT_APP_ENV === "production"

const hasCustomLocalSubgraphEndpoint = process.env.REACT_APP_LOCAL_SUBGRAPH_ENDPOINT?.length > 0;
const escMainnetStagingSubgraph = hasCustomLocalSubgraphEndpoint ? process.env.REACT_APP_LOCAL_SUBGRAPH_ENDPOINT : "https://graph.bel2.org/subgraphs/name/bel2-loan-esc-staging";
const escTestnetSubgraph = hasCustomLocalSubgraphEndpoint ? process.env.REACT_APP_LOCAL_SUBGRAPH_ENDPOINT : "https://graph.bel2.org/subgraphs/name/bel2-loan-esc-testnet";

/**
 * List of supported EVMs the work can run on.
 */
export const chainList: ChainConfig[] = [
  {
    name: "Elastos Smart Chain",
    rpcs: ["https://api2.elastos.net/esc"],
    explorers: ["https://esc.elastos.io"],
    chainId: 20,
    networkMode: "mainnet",
    subgraph: {
      endpoint: productionBuild ? "https://graph.bel2.org/subgraphs/name/bel2-loan-esc-prod" : escMainnetStagingSubgraph
    },
    nativeCurrency: {
      name: "ELA",
      symbol: "ELA",
      decimals: 18,
      wrappedAddress: "0x517E9e5d46C1EA8aB6f78677d6114Ef47F71f6c4"
    },
    contracts: {
      orderFactory: productionBuild ? "0x60Ff693e5b900d62437d160764bC9D703A93F4ab" : "0xabD1FE0Aca898Cd3fFE8041302b88b4b9Db9BD09",
      multicall3: "0x174BCCBfe2523af4af7791B963F52EEb81d0E92f",
      btcOracle: "0x7a581772B0b21f5B8880E881C495cb7AfDfA228c",
      interest: "0x0392d3496102104851d161e6917b4907490258c2",
      arbitrator: "0x45679eD4f33Ed1Edb6A4E8075b4300C4169bBf1c"
    },
    tokens: [
      escBtcToken,
      escUSDTToken,
      escUSDCToken
    ]
  },
  {
    name: "Elastos Smart Chain Testnet",
    rpcs: ["https://api-testnet.elastos.io/esc"],
    explorers: ["https://esc-testnet.elastos.io"],
    chainId: 21,
    networkMode: "testnet",
    subgraph: {
      endpoint: escTestnetSubgraph
    },
    nativeCurrency: {
      name: "tELA",
      symbol: "tELA",
      decimals: 18,
      wrappedAddress: "0x517E9e5d46C1EA8aB6f78677d6114Ef47F71f6c4"
    },
    contracts: {
      orderFactory: "0x45679eD4f33Ed1Edb6A4E8075b4300C4169bBf1c",
      multicall3: "0x6893bB6c01EfC0e436991359aF024923Ab20f6bc",
      btcOracle: "0xb4FEc0051eC19e71b89234D0523C97c0E2101B0F",
      interest: "0x297E3894Edbaa9316d32ceDc0B5b2767FD89f558",
      arbitrator: "0x1251d808b8102eC48f5Aa5BB0C1de021440047d9"
    },
    tokens: [
      escTestnetBtcToken,
      escTestnetUSDTToken
    ]
  }
];

/**
 * Chain to use as default in case no wallet is connected.
 * Useful to fetch data for previewing before attempting to interact.
 */
export const defaultChainConfig = chainList[0];