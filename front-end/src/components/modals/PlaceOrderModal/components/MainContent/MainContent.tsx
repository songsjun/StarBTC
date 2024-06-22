import { ResponsiveTableCell } from "@components/base/ResponsiveTable/ResponsiveTableCell"
import { ResponsiveTableRow } from "@components/base/ResponsiveTable/ResponsiveTableRow"
import { SectionIntroText } from "@components/base/SectionIntroText"
import { IconTip } from "@components/base/Tip"
import { successToast } from "@components/base/Toast"
import { DepositedToken } from "@components/data/DepositedToken/DepositedToken"
import { EnsureWalletNetwork } from "@components/data/EnsureWalletNetwork/EnsureWalletNetwork"
import { WarningDemoButton } from "@components/data/WarningDemoButton/WarningDemoButton"
import { ModalButtonStack } from "@components/modals/ModalButtonStack/ModalButtonStack"
import { MainContentStack, OrderTableCellHeading } from "@components/modals/OrderModal/OrderModal.styles"
import { WalletContext } from "@contexts/WalletContext"
import { LoadingButton } from "@mui/lab"
import { Button, Stack, Table, TableBody } from "@mui/material"
import { useBitcoinWalletAction } from "@services/btc/hooks/useBitcoinWalletAction"
import { useActiveEVMChainConfig } from "@services/chains/hooks/useActiveEVMChainConfig"
import { useERC20Balance } from "@services/evm/hooks/useERC20Balance"
import { useERC20Contract } from "@services/evm/hooks/useERC20Contract"
import { useEnoughERC20Allowance } from "@services/evm/hooks/useEnoughERC20Allowance"
import { useInterestInfo } from "@services/orders/hooks/useInterestInfo"
import { useOrderFactoryContract } from "@services/orders/loan-contract/useOrderFactoryContract"
import { LoanOrder } from "@services/orders/model/loan-order"
import { useCoinPrice } from "@services/pricing/hooks/useCoinPrice"
import { TokenOrNative } from "@services/tokens/token-or-native"
import { escUSDTToken } from "@services/tokens/tokens"
import { useScreenSize } from "@services/ui-ux/hooks/useScreenSize"
import { showDebugActions } from "@utils/debug"
import { formSchemaValidator } from "@utils/form-schema-validator"
import { formatAddress } from "@utils/formatAddress"
import { formatNumber, formatUSD } from "@utils/formatNumber"
import BigNumber from "bignumber.js"
import { motion } from "framer-motion"
import { FC, useCallback, useContext, useEffect, useMemo, useState } from "react"
import 'rsuite/Slider/styles/index.css'
import { NameField, USDValueField } from "../../PlaceOrderModal.styles"
import { PageError, PlaceOrderFormData } from "../../types"
import { DurationPicker } from "../DurationPicker"
import { InputField } from "../InputField"
import { TipPicker } from "../TipPicker"
import { TokenPicker } from "../TokenPicker"
import "./styles.css"
import { useMarketOrderValidationSchema } from "./validationSchema"

const defaultFormData: PlaceOrderFormData = {
  deposited: "1",
};

export const MainContent: FC<{
  onOrderPlaced: (order: LoanOrder) => void;
  onCancel: () => void;
}> = ({ onOrderPlaced, onCancel }) => {
  const [submitting, setSubmitting] = useState(false);
  const { bitcoinAccount } = useContext(WalletContext);
  const [formData, setFormData] = useState<PlaceOrderFormData>(defaultFormData);
  const [formError, setFormError] = useState<PageError<PlaceOrderFormData>>({});
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [loanDuration, setLoanDuration] = useState<number>(7);
  const [depositedToken, setDepositedToken] = useState<TokenOrNative>(escUSDTToken);
  const activeChain = useActiveEVMChainConfig();
  const depositedTokenPrice = useCoinPrice(depositedToken?.symbol);
  const depositedTokenAmount = useMemo(() => formData.deposited ? new BigNumber(formData.deposited) : undefined, [formData.deposited]);
  const depositedUsdValue = depositedTokenPrice ? depositedTokenAmount?.multipliedBy(depositedTokenPrice) : undefined;
  const validationSchema = useMarketOrderValidationSchema(depositedToken);
  const { isXsScreen } = useScreenSize();
  const { displayBalance: erc20TokenBalance } = useERC20Balance(depositedToken?.symbol);
  const allAmountsValid = depositedUsdValue && !depositedUsdValue.isNaN() && (depositedToken.isNative || depositedTokenAmount.lte(erc20TokenBalance));
  const { createLendingOrder } = useOrderFactoryContract();
  const { approve } = useERC20Contract(depositedToken?.contractAddress);
  const { getPublicKey } = useBitcoinWalletAction();
  const info = useInterestInfo(depositedTokenAmount?.toNumber(), depositedToken, loanDuration);
  const [tipAmount, setTipAmount] = useState(0);
  const amountToTransfer = depositedTokenAmount; // Lender tip should not be transfered. It is deduced from the returned token amount when the order gets closed.
  const { enoughAllowance: enoughErc20Allowance, refreshAllowance } = useEnoughERC20Allowance(depositedToken?.contractAddress, activeChain?.contracts.orderFactory, amountToTransfer);
  const validate = useCallback((node: keyof PlaceOrderFormData, formData: PlaceOrderFormData) => {
    const error = formSchemaValidator(validationSchema, node, formData);
    setFormError((prevState) => ({ ...prevState, [node]: error?.[0] || "", }));
  }, [validationSchema]);
  const availableDurations = [...(showDebugActions() ? [0] : []), 7, 15, 30, 60, 90];

  const handleFormDataUpdate = useCallback(<K extends keyof PlaceOrderFormData>(key: K, value: PlaceOrderFormData[typeof key]) => {
    setFormData((prevState) => {
      const formData = { ...prevState, [key]: value };
      validate(key, formData);
      return formData;
    });
  }, [validate]);

  useEffect(() => {
    setIsFormValid(validationSchema.isValidSync(formData));
  }, [formData, validationSchema, loanDuration]);

  // Is token is ERC20, check available balance vs input amount and show an error is not enough tokens
  useEffect(() => {
    if (!depositedToken?.isNative && amountToTransfer?.gt(erc20TokenBalance))
      setFormError((prevState) => ({ ...prevState, ["deposited"]: "Not enough tokens", }));
  }, [depositedToken, amountToTransfer, erc20TokenBalance]);

  const handleTokenChanged = useCallback((token: TokenOrNative) => {
    setDepositedToken(token);

    // Change input amount to min place amount for this new token
    if (!depositedTokenAmount || depositedTokenAmount.lt(token.minPlaceAmount))
      handleFormDataUpdate("deposited", `${token.minPlaceAmount}`);
  }, [depositedTokenAmount, handleFormDataUpdate]);

  const handleDurationChanged = useCallback((duration: number) => {
    setLoanDuration(duration);
  }, []);

  const handleTipValueChanged = useCallback((value: number) => {
    setTipAmount(value);
  }, []);

  /**
   * Publish transaction to increase ERC20 token allowance from user wallet
   * for the factory contract.
   */
  const handleApproveSpending = useCallback(async () => {
    setSubmitting(true);
    await approve(activeChain.contracts.orderFactory, depositedToken, amountToTransfer);
    refreshAllowance();
    setSubmitting(false);
  }, [activeChain.contracts.orderFactory, approve, amountToTransfer, depositedToken, refreshAllowance]);

  const handlePlaceOrder = useCallback(async () => {
    setSubmitting(true);

    const publicKey = await getPublicKey();
    if (publicKey) {
      const placedOrder = await createLendingOrder(depositedToken, depositedTokenAmount.toFixed(), loanDuration, bitcoinAccount, publicKey, tipAmount);
      if (placedOrder) {
        console.log("Created lending order:", placedOrder);
        onOrderPlaced(placedOrder);

        successToast("Your lending order is now visible!");
      }
    }

    setSubmitting(false);
  }, [createLendingOrder, depositedToken, depositedTokenAmount, onOrderPlaced, getPublicKey, loanDuration, bitcoinAccount, tipAmount]);

  return (
    <>
      {/* Main form */}
      <MainContentStack>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} >
          <SectionIntroText sx={{ mb: 2 }}>
            Set the number of {depositedToken.symbol} you want to lend. The borrower will lock his BTC as a collateral when accepting your order. When the borrower repays the loan, you will receive your initial USDT deposit plus the interests.
          </SectionIntroText>
          <Table>
            <TableBody>
              {/* Deposited token */}
              <ResponsiveTableRow>
                <ResponsiveTableCell>
                  <NameField>I provide</NameField>
                  {!isXsScreen && <USDValueField>{formatUSD(depositedUsdValue)}</USDValueField>}
                </ResponsiveTableCell>
                <ResponsiveTableCell>
                  <Stack direction="row" alignItems="center" gap={2}>
                    {isXsScreen && <USDValueField>{formatUSD(depositedUsdValue)}</USDValueField>}
                    <InputField id="deposited" placeholder="Amount of deposited tokens" onChange={v => handleFormDataUpdate("deposited", v)} formData={formData} formError={formError} />
                    <TokenPicker defaultToken={depositedToken} onTokenSelected={handleTokenChanged} />
                  </Stack>
                </ResponsiveTableCell>
              </ResponsiveTableRow>

              {/* Loan duration */}
              <ResponsiveTableRow>
                <ResponsiveTableCell>
                  <OrderTableCellHeading>
                    <NameField>Max duration</NameField>
                    <IconTip content="Duration before which the borrower needs to repay the loan. He can repay earlier. The longer the duration, the higher the interest." />
                  </OrderTableCellHeading>
                </ResponsiveTableCell>
                <ResponsiveTableCell>
                  <Stack direction="row" alignItems="center" gap={2}>
                    <DurationPicker availableValues={availableDurations} defaultValue={7} onDurationSelected={handleDurationChanged} />
                  </Stack>
                </ResponsiveTableCell>
              </ResponsiveTableRow>

              {/* Tip for manual confirmation */}
              <ResponsiveTableRow>
                <ResponsiveTableCell>
                  <OrderTableCellHeading>
                    <NameField>Confirmation tip</NameField>
                    <IconTip content="Optional tip you give to the borrower to incentivize him to quickly confirm your BTC unlock transfer during repayment. This can help getting your lent tokens faster. If the borrower doesn't confirm rapidly, you get this amount back when the order gets closed." />
                  </OrderTableCellHeading>
                </ResponsiveTableCell>
                <ResponsiveTableCell>
                  <Stack direction="row" alignItems="center" gap={2}>
                    <TipPicker availableValues={[0, 1, 2, 5, 10, 20]} defaultValue={tipAmount} token={depositedToken} onValueSelected={handleTipValueChanged} />
                  </Stack>
                </ResponsiveTableCell>
              </ResponsiveTableRow>

              {/* BTC address */}
              <ResponsiveTableRow>
                <ResponsiveTableCell>
                  <OrderTableCellHeading>
                    <NameField>BTC address</NameField>
                    <IconTip content="Address where you will receive borrower's BTC tokens in case the loan is not repaid" />
                  </OrderTableCellHeading>
                </ResponsiveTableCell>
                <ResponsiveTableCell>
                  <Stack direction="row" alignItems="center" gap={2}>
                    {bitcoinAccount ? formatAddress(bitcoinAccount, [10, 10]) : "Please connect wallet"}
                  </Stack>
                </ResponsiveTableCell>
              </ResponsiveTableRow>

              {/* Interest rate */}
              <ResponsiveTableRow>
                <ResponsiveTableCell>
                  <OrderTableCellHeading>
                    <NameField>Interest</NameField>
                  </OrderTableCellHeading>
                </ResponsiveTableCell>
                <ResponsiveTableCell>
                  {formatNumber(info?.interestRate.toNumber(), { output: "percent", decimal: 2 })}
                  &nbsp;({formatNumber(info?.interestRate.dividedBy(loanDuration).multipliedBy(365).toNumber(), { output: "percent", decimal: 2 })} APR)
                </ResponsiveTableCell>
              </ResponsiveTableRow>

              {/* Interest amount */}
              <ResponsiveTableRow>
                <ResponsiveTableCell>
                  <OrderTableCellHeading>
                    <NameField>Interest amount</NameField>
                  </OrderTableCellHeading>
                </ResponsiveTableCell>
                <ResponsiveTableCell>
                  <DepositedToken justifyContent="flex-start" amount={info?.interestAmount} token={depositedToken} decimals={4} />
                </ResponsiveTableCell>
              </ResponsiveTableRow>
            </TableBody>
          </Table>

          {/* {
            expectedUSDReturn &&
            <Stack direction="row" gap={1} alignItems="center" justifyContent="center" sx={{ mt: 2 }}>
              <SectionIntroText>Expected return at current market price: {formatUSD(expectedUSDReturn.toNumber())} </SectionIntroText>
            </Stack>
          } */}
        </motion.div>
      </MainContentStack >


      {/* Footer */}
      < ModalButtonStack >
        <Button
          fullWidth
          size="large"
          variant="outlined"
          disabled={submitting}
          onClick={onCancel}>
          Close
        </Button>
        <EnsureWalletNetwork continuesTo="Place order" evmConnectedNeeded btcAccountNeeded fullWidth>
          <WarningDemoButton action="Place order" fullWidth>
            {enoughErc20Allowance && <LoadingButton
              fullWidth
              size="large"
              variant="contained"
              loading={submitting}
              disabled={!allAmountsValid || !isFormValid}
              onClick={handlePlaceOrder}
            >
              Place order
            </LoadingButton>}
            {!enoughErc20Allowance && <LoadingButton
              fullWidth
              size="large"
              variant="contained"
              loading={submitting}
              disabled={!allAmountsValid || !isFormValid || enoughErc20Allowance === undefined}
              onClick={handleApproveSpending}
            >
              Approve spending
            </LoadingButton>}
          </WarningDemoButton>
        </EnsureWalletNetwork>
      </ModalButtonStack >
    </>
  )
}
