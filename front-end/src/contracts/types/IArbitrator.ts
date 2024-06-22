/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  PayableOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
} from "./common";

export interface IArbitratorInterface extends utils.Interface {
  functions: {
    "getArbitrationStatus(bytes32)": FunctionFragment;
    "getArbitratorPublicKey()": FunctionFragment;
    "requestArbitration(bytes,bytes32)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "getArbitrationStatus"
      | "getArbitratorPublicKey"
      | "requestArbitration"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "getArbitrationStatus",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getArbitratorPublicKey",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "requestArbitration",
    values: [BytesLike, BytesLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "getArbitrationStatus",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getArbitratorPublicKey",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "requestArbitration",
    data: BytesLike
  ): Result;

  events: {};
}

export interface IArbitrator extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: IArbitratorInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    getArbitrationStatus(
      _queryId: BytesLike,
      overrides?: CallOverrides
    ): Promise<[number]>;

    getArbitratorPublicKey(overrides?: CallOverrides): Promise<[string]>;

    requestArbitration(
      _btcTxToSign: BytesLike,
      _queryId: BytesLike,
      overrides?: PayableOverrides & { from?: string }
    ): Promise<ContractTransaction>;
  };

  getArbitrationStatus(
    _queryId: BytesLike,
    overrides?: CallOverrides
  ): Promise<number>;

  getArbitratorPublicKey(overrides?: CallOverrides): Promise<string>;

  requestArbitration(
    _btcTxToSign: BytesLike,
    _queryId: BytesLike,
    overrides?: PayableOverrides & { from?: string }
  ): Promise<ContractTransaction>;

  callStatic: {
    getArbitrationStatus(
      _queryId: BytesLike,
      overrides?: CallOverrides
    ): Promise<number>;

    getArbitratorPublicKey(overrides?: CallOverrides): Promise<string>;

    requestArbitration(
      _btcTxToSign: BytesLike,
      _queryId: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {};

  estimateGas: {
    getArbitrationStatus(
      _queryId: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getArbitratorPublicKey(overrides?: CallOverrides): Promise<BigNumber>;

    requestArbitration(
      _btcTxToSign: BytesLike,
      _queryId: BytesLike,
      overrides?: PayableOverrides & { from?: string }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    getArbitrationStatus(
      _queryId: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getArbitratorPublicKey(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    requestArbitration(
      _btcTxToSign: BytesLike,
      _queryId: BytesLike,
      overrides?: PayableOverrides & { from?: string }
    ): Promise<PopulatedTransaction>;
  };
}
