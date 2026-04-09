// --- Search index ---

export const searchItems = [
  { story: 'ConnectWallet', section: 'Interactive', description: 'Toggle props live' },
  { story: 'ConnectWallet', section: 'Default' },
  { story: 'ConnectWallet', section: 'Custom Label' },
  { story: 'ConnectWallet', section: 'Hide Balance' },
  { story: 'ConnectWallet', section: 'Hide Avatar' },
  { story: 'ConnectWallet', section: 'Chain Enforcement (Sepolia)', description: 'Wrong chain handling' },
  { story: 'ConnectWallet', section: 'With Callbacks', description: 'onConnect, onDisconnect, onError' },
  { story: 'ConnectWallet', section: 'Custom Address Format', description: 'formatAddress prop' },
  { story: 'ConnectWallet', section: 'Custom Labels (Spanish)', description: 'i18n via labels prop' },
  { story: 'ConnectWallet', section: 'Custom Render', description: 'children-as-function' },
  { story: 'ConnectWallet', section: 'Headless Hook', description: 'useWalletState' },
  { story: 'TokenBalance', section: 'Interactive', description: 'Toggle props live' },
  { story: 'TokenBalance', section: 'Loading State', description: 'Skeleton animation' },
  { story: 'TokenBalance', section: 'Default (Native ETH)' },
  { story: 'TokenBalance', section: 'ERC-20 (USDC)' },
  { story: 'TokenBalance', section: 'With Icon' },
  { story: 'TokenBalance', section: 'Custom Address (vitalik.eth)', description: 'No wallet needed' },
  { story: 'TokenBalance', section: 'Hide Fiat' },
  { story: 'TokenBalance', section: 'EUR Currency' },
  { story: 'TokenBalance', section: 'Custom Render', description: 'children-as-function' },
  { story: 'TokenBalance', section: 'Headless Hook', description: 'useTokenBalance' },
  { story: 'TransactionButton', section: 'State Machine', description: '10 states lifecycle' },
  { story: 'TransactionButton', section: 'Interactive', description: 'Toggle props live' },
  { story: 'TransactionButton', section: 'Raw ETH Transfer', description: 'Sepolia testnet' },
  { story: 'TransactionButton', section: 'Contract Call', description: 'ERC-20 with ABI' },
  { story: 'TransactionButton', section: 'Approval Flow', description: 'Approve + transfer' },
  { story: 'TransactionButton', section: 'Safety Delay', description: '5-second confirmation' },
  { story: 'TransactionButton', section: 'Custom Render', description: 'children-as-function' },
  { story: 'TransactionButton', section: 'Headless Hook', description: 'useTransactionFlow' },
  { story: 'ContractForm', section: 'Interactive', description: 'Toggle function and props live' },
  { story: 'ContractForm', section: 'ERC-20 Transfer', description: 'Address and amount fields' },
  { story: 'ContractForm', section: 'Security Warnings', description: 'Approve with MAX_UINT256' },
  { story: 'ContractForm', section: 'Mixed Types', description: 'String, uint8, bool, address' },
  { story: 'ContractForm', section: 'Custom Render', description: 'children-as-function' },
  { story: 'ContractForm', section: 'Headless Hook', description: 'useContractForm' },
  { story: 'TxKitProvider', section: 'Default Config', description: 'Standalone with auto theme' },
  { story: 'TxKitProvider', section: 'Dark Theme' },
  { story: 'TxKitProvider', section: 'Light Theme' },
  { story: 'TxKitProvider', section: 'Embedded Mode', description: 'Existing WagmiProvider' },
  { story: 'TxKitProvider', section: 'Embedded Dark' },
  { story: 'TxKitProvider', section: 'Embedded Light' },
]


// --- Props definitions ---

export const componentProps = {
  ConnectWallet: {
    importPath: '@txkit/react',
    props: [
      { name: 'className', type: 'string', description: 'Custom CSS class' },
      { name: 'label', type: 'string', default: '"Connect Wallet"', description: 'Button label for disconnected state. Ignored when connected' },
      { name: 'chainId', type: 'number', description: 'Required chain ID - shows switch network if mismatched' },
      { name: 'labels', type: 'Partial<Labels>', description: 'Override all UI text strings for i18n' },
      { name: 'showBalance', type: 'boolean', default: 'true', description: 'Show ETH balance when connected' },
      { name: 'showAvatar', type: 'boolean', default: 'true', description: 'Show avatar/ENS avatar when connected' },
      { name: 'showEns', type: 'boolean', default: 'true', description: 'Show ENS name instead of address' },
      { name: 'onConnect', type: '(data) => void', description: 'Called after successful connection' },
      { name: 'onDisconnect', type: '() => void', description: 'Called after disconnect' },
      { name: 'onError', type: '(error) => void', description: 'Called on connection error' },
      { name: 'formatAddress', type: '(addr, ens?) => string', description: 'Custom address display format' },
      { name: 'children', type: '(data) => ReactNode', description: 'Render function for full control' },
    ],
  },
  TokenBalance: {
    importPath: '@txkit/react',
    props: [
      { name: 'token', type: 'Address', description: 'ERC-20 contract address. Omit for native ETH' },
      { name: 'address', type: 'Address', description: 'Wallet address to check. Defaults to connected wallet' },
      { name: 'showFiat', type: 'boolean', default: 'true', description: 'Show USD/fiat equivalent' },
      { name: 'showIcon', type: 'boolean', default: 'false', description: 'Show token icon' },
      { name: 'showSymbol', type: 'boolean', default: 'true', description: 'Show token symbol (ETH, USDC)' },
      { name: 'fiatCurrency', type: 'string', default: '"USD"', description: 'Fiat currency code (USD, EUR, GBP)' },
      { name: 'price', type: 'number', description: 'Manual price override (skip DeFiLlama)' },
      { name: 'icon', type: 'string', description: 'Token icon URL' },
      { name: 'onBalanceChange', type: '(balance, prev) => void', description: 'Called when balance changes' },
      { name: 'children', type: '(data) => ReactNode', description: 'Render function for full control' },
    ],
  },
  TransactionButton: {
    importPath: '@txkit/react',
    props: [
      { name: 'steps', type: 'FlowStep[]', required: true, description: 'Step definitions for this transaction flow' },
      { name: 'label', type: 'string', description: 'Button label text' },
      { name: 'flowId', type: 'string', default: '"__default__"', description: 'Flow ID for parallel flows' },
      { name: 'chainId', type: 'number', description: 'Target chain - auto-switches if mismatched' },
      { name: 'safety', type: 'SafetyConfig', description: 'Simulation, delay timer, risk provider' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the button' },
      { name: 'showExplorerLink', type: 'boolean', default: 'true', description: 'Show explorer link after tx' },
      { name: 'onFlowComplete', type: '(results) => void', description: 'Called when entire flow completes' },
      { name: 'onStepComplete', type: '(stepId, result) => void', description: 'Called on any step completion' },
      { name: 'onError', type: '(error, stepId) => void', description: 'Called on any step error' },
      { name: 'children', type: '(data) => ReactNode', description: 'Render function for full control' },
    ],
  },
  ContractForm: {
    importPath: '@txkit/react',
    props: [
      { name: 'address', type: 'Address', required: true, description: 'Contract address' },
      { name: 'abi', type: 'Abi', required: true, description: 'Contract ABI' },
      { name: 'functionName', type: 'string', required: true, description: 'Function to call' },
      { name: 'label', type: 'string', default: 'functionName', description: 'Submit button label' },
      { name: 'chainId', type: 'number', description: 'Target chain' },
      { name: 'safety', type: 'SafetyConfig', description: 'Anti-phishing config' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable form' },
      { name: 'onSuccess', type: '(receipt) => void', description: 'Called on confirmation' },
      { name: 'onError', type: '(error) => void', description: 'Called on error' },
      { name: 'children', type: '(data) => ReactNode', description: 'Render function for full control' },
    ],
  },
} as const


// --- Component descriptions ---

export const componentDescriptions: Record<string, { summary: string; docsPath?: string }> = {
  ConnectWallet: {
    summary: 'Multi-wallet connection button with ENS, balance display, chain switching, and wallet grouping. 5-state machine: disconnected, connecting, connected, wrong-chain, error.',
    docsPath: '/api/connect-wallet',
  },
  TokenBalance: {
    summary: 'ERC-20 and native token balance display with auto-formatting, fiat conversion via DeFiLlama, and real-time polling.',
    docsPath: '/api/token-balance',
  },
  TransactionButton: {
    summary: 'Multi-step transaction flow with approve, sign, and wait stages. Supports simulation, safety delays, and compound components (FlowSteps, FlowToast, FlowProgress).',
    docsPath: '/api/transaction-button',
  },
  ContractForm: {
    summary: 'Auto-generated form from Solidity ABI with type-specific inputs, validation, security warnings for dangerous functions, and calldata preview.',
    docsPath: '/api/contract-form',
  },
  TxKitProvider: {
    summary: 'Root wrapper that initializes wagmi, TanStack Query, and theming. Standalone mode creates providers internally. Embedded mode reuses an existing WagmiProvider - for projects with RainbowKit, ConnectKit, or custom wallet setup.',
    docsPath: '/getting-started',
  },
}


// --- Bundle size data ---

export const bundleSizes: Record<string, { js: string; css: string }> = {
  ConnectWallet: { js: '4.8 kB', css: '2.1 kB' },
  TokenBalance: { js: '4.6 kB', css: '2.1 kB' },
  TransactionButton: { js: '6.5 kB', css: '2.1 kB' },
  ContractForm: { js: '5.2 kB', css: '1.8 kB' },
  TxKitProvider: { js: '2.1 kB', css: '0.3 kB' },
}
