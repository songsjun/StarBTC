import { BehaviorSubject } from "rxjs";

export type NetworkMode = "mainnet" | "testnet";

/**
 * RxJS subject in addition to hooks, to be able to deal with the network mode outside of react hooks (services).
 */
export const networkMode$ = new BehaviorSubject<NetworkMode>(undefined);

export const isMainnetNetworkInUse = () => {
  return networkMode$.value === "mainnet";
}