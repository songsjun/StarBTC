import * as Sentry from "@sentry/react";
import { useSnackbar } from "notistack";
import { ReactNode, createContext, memo, useCallback, useContext } from "react";

export type ErrorHandlerProvider = {
  children: ReactNode;
};

type ErrorHandlerContextValue = {
  handleError: (error: any, account?: string) => void;
};

export enum MetaMaskErrorCode {
  REJECTION_ERROR_CODE = 4001,
  UNRECOGNIZED_CHAIN_ERR_CODE = 4902,
  WAIT_WALLET_RESPONSE = -32002,
  JSON_RPC_ERROR = -32603,
}

enum EthersErrorCode {
  REJECTION_ERROR_CODE = "ACTION_REJECTED",
  UNPREDICTABLE_GAS_LIMIT = "UNPREDICTABLE_GAS_LIMIT",
}

export enum BusinessErrorCode {
  WRONG_NETWORK = "WRONG_NETWORK",
  NOT_CONNECT = "NOT_CONNECT",
  INSUFFICIENT_BALANCE = 50,
  INVALID_AUTHORIZATION = 401,
}

export type ErrorCode = MetaMaskErrorCode | EthersErrorCode | BusinessErrorCode;

const handleJSONrpcError = (data: {
  code: number;
  message: string;
  data: string;
}) => {
  switch (data?.data) {
    case "0xbc17cfe8":
      return "The order has been filled or canceled";
    case "0xf0a039b2":
      return "All orders were filled";
    default:
      return data?.message;
  }
};

const getErrorMessage = (code: ErrorCode, data: any) => {
  switch (code) {
    case MetaMaskErrorCode.REJECTION_ERROR_CODE:
    case EthersErrorCode.REJECTION_ERROR_CODE:
      return "Action has been rejected!";
    case MetaMaskErrorCode.UNRECOGNIZED_CHAIN_ERR_CODE:
      return "ChainId cannot be recognized.";
    case MetaMaskErrorCode.WAIT_WALLET_RESPONSE:
      return "Please check your wallet!";
    case MetaMaskErrorCode.JSON_RPC_ERROR:
    case EthersErrorCode.UNPREDICTABLE_GAS_LIMIT:
      return handleJSONrpcError(data);
    case BusinessErrorCode.NOT_CONNECT:
      return "Please connect your wallet!";
    case BusinessErrorCode.WRONG_NETWORK:
      return "Please switch to correct network!";
    case BusinessErrorCode.INSUFFICIENT_BALANCE:
      return "You don't have enough tokens!";
    case BusinessErrorCode.INVALID_AUTHORIZATION:
      return "Your signature is out of date! Please try again.";
    default:
      return null;
  }
};

const mapToErrorMessage = (error: any) => {
  return (
    getErrorMessage(error.code as ErrorCode, error.error?.data) ||
    error.message ||
    error.error?.message ||
    "Unknown error happened when sending request."
  );
};

const ErrorHandlerContext = createContext<ErrorHandlerContextValue | null>(
  null
);

export const ErrorHandlerProvider = memo(
  ({ children }: ErrorHandlerProvider) => {
    const { enqueueSnackbar } = useSnackbar();

    const handleError = useCallback(
      (error: any) => {
        const errorMessage = mapToErrorMessage(error);

        // Print to console before showing to user
        console.error(error);

        // Send manually to sentry
        Sentry.captureException(error);

        return enqueueSnackbar({
          variant: "error",
          message: errorMessage,
          autoHideDuration: 6000,
        });
      },
      [enqueueSnackbar]
    );

    return (
      <ErrorHandlerContext.Provider value={{ handleError }}>
        {children}
      </ErrorHandlerContext.Provider>
    );
  }
);

export const useErrorHandler = () => {
  const context = useContext(ErrorHandlerContext);

  if (context === null) {
    throw new Error("context is not ready");
  }

  return context;
};
