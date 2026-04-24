// --- Provider ---
export { default as TxKitProvider, useTxKit } from './components/TxKitProvider/TxKitProvider'
export type { TxKitProviderProps } from './components/TxKitProvider/TxKitProvider'

// --- ConnectWallet ---
export { default as ConnectWallet } from './components/ConnectWallet/ConnectWallet'
export { default as useWalletState } from './hooks/useWalletState'
export { default as useDisplayUri } from './components/ConnectWallet/utils/useDisplayUri'
export type { ConnectWalletLabels } from './components/ConnectWallet/labels'
export type { ConnectWalletProps, ConnectWalletRenderData } from './types/connect'
export type { UseDisplayUriReturn } from './components/ConnectWallet/utils/useDisplayUri'
export type { WalletState, UseWalletStateOptions, UseWalletStateReturn } from './hooks/useWalletState'

// --- TokenBalance ---
export { default as TokenBalance } from './components/TokenBalance/TokenBalance'
export { default as useTokenPrice } from './hooks/useTokenPrice'
export { default as useTokenBalance } from './hooks/useTokenBalance'
export { default as useTokenBalances } from './hooks/useTokenBalances'
export { default as useBalanceInvalidation } from './hooks/useBalanceInvalidation'
export { useBalanceContext } from './hooks/useBalanceContext'
export type { TokenBalanceLabels } from './components/TokenBalance/labels'
export type { UseTokenPriceOptions, UseTokenPriceReturn } from './hooks/useTokenPrice'
export type { UseTokenBalanceOptions, UseTokenBalanceReturn } from './hooks/useTokenBalance'
export type { TokenBalanceItem, UseTokenBalancesOptions, UseTokenBalancesReturn } from './hooks/useTokenBalances'
export type { UseBalanceInvalidationReturn } from './hooks/useBalanceInvalidation'
export type { BalanceContextValue } from './hooks/useBalanceContext'
export type { AffectedBalance } from './helpers/parseAffectedBalances'
export type {
  TokenBalanceProps,
  TokenBalanceRenderData,
  TokenBalanceFormatOptions,
} from './types/balance'

// --- Transaction Flow ---
export { default as TransactionButton } from './components/TransactionButton/TransactionButton'
export { default as FlowSteps } from './components/FlowSteps/FlowSteps'
export { default as FlowProgress } from './components/FlowProgress/FlowProgress'
export { default as FlowToast } from './components/FlowToast/FlowToast'
export { default as useTransactionFlow } from './hooks/useTransactionFlow'
export { useFlowState, useFlowStore, DEFAULT_FLOW_ID } from './hooks/useFlowState'
export { setFlowEntry, notifyFlowListeners } from './components/TxKitProvider/utils/flowStore'
export type { FlowStore, FlowEntry } from './components/TxKitProvider/utils/flowStore'
export { txStep, approveAndExecute, multiApproveAndExecute, signAndSubmit } from './components/TxKitProvider/utils/flowHelpers'
export type { TransactionButtonLabels } from './components/TransactionButton/labels'
export type {
  TransactionButtonProps,
  TransactionButtonRenderData,
  TxParams,
  RawTransactionProps,
  ContractTransactionProps,
  SafetyConfig,
  TransactionRiskProvider,
  FlowStep,
  FlowStepTx,
  FlowStepSign,
  FlowState,
  FlowActions,
  StepState,
  StepContext,
  StepResult,
  UseTransactionFlowOptions,
  UseTransactionFlowReturn,
} from './types/transaction'

// --- Input primitives ---
export { default as TextInput } from './components/Inputs/TextInput'
export { default as NumberInput } from './components/Inputs/NumberInput'
export { default as AddressInput } from './components/Inputs/AddressInput'
export { default as Checkbox } from './components/Inputs/Checkbox'
export { default as Select } from './components/Inputs/Select'
export type { TextInputProps } from './components/Inputs/TextInput'
export type { NumberInputProps } from './components/Inputs/NumberInput'
export type { AddressInputProps, AddressValidity } from './components/Inputs/AddressInput'
export type { CheckboxProps } from './components/Inputs/Checkbox'
export type { SelectProps, SelectOption } from './components/Inputs/Select'

// --- ContractForm ---
// Deferred to v0.1.0. Component code, hook, tests, and types remain in the tree
// but are not part of the public v0.1.0 surface. Re-enable in the v0.1.0 release
// once Phase 2b (read functions, multi-function, ENS, gas estimation) is ready.
