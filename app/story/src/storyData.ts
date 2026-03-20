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
  { story: 'TransactionButton', section: 'Headless Hook', description: 'useTransactionState' },
  { story: 'TxKitProvider', section: 'Default Config' },
  { story: 'TxKitProvider', section: 'Dark Theme' },
  { story: 'TxKitProvider', section: 'Light Theme' },
  { story: 'Embedded Mode', section: 'Basic Embedded', description: 'Existing WagmiProvider' },
  { story: 'Embedded Mode', section: 'Dark Theme' },
  { story: 'Embedded Mode', section: 'Light Theme' },
]


// --- Props definitions ---

export const componentProps = {
  ConnectWallet: {
    importPath: '@txkit/react',
    props: [
      { name: 'className', type: 'string', description: 'Custom CSS class' },
      { name: 'label', type: 'string', default: '"Connect Wallet"', description: 'Button label text' },
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
      { name: 'tx', type: 'TxParams', required: true, description: 'Transaction params: { to, value } or { address, abi, functionName, args }' },
      { name: 'label', type: 'string', description: 'Button label text' },
      { name: 'chainId', type: 'number', description: 'Target chain - auto-switches if mismatched' },
      { name: 'approval', type: 'ApprovalConfig', description: 'ERC-20 approve before main tx' },
      { name: 'safety', type: 'SafetyConfig', description: 'Simulation, delay timer, risk provider' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the button' },
      { name: 'showExplorerLink', type: 'boolean', default: 'true', description: 'Show explorer link after tx' },
      { name: 'onSubmit', type: '(hash) => void', description: 'Called when tx is submitted to mempool' },
      { name: 'onSuccess', type: '({ hash, receipt }) => void', description: 'Called when tx is confirmed' },
      { name: 'onError', type: '(error) => void', description: 'Called on tx error or revert' },
      { name: 'children', type: '(data) => ReactNode', description: 'Render function for full control' },
    ],
  },
} as const


// --- Bundle size data ---

export const bundleSizes: Record<string, { js: string; css: string }> = {
  ConnectWallet: { js: '4.8 kB', css: '2.1 kB' },
  TokenBalance: { js: '4.6 kB', css: '2.1 kB' },
  TransactionButton: { js: '6.5 kB', css: '2.1 kB' },
}
