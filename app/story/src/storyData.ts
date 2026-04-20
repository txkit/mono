// --- Search index ---

export const searchItems = [
  { story: 'ConnectWallet', section: 'Interactive', description: 'Toggle props live' },
  { story: 'ConnectWallet', section: 'Default' },
  { story: 'ConnectWallet', section: 'Custom Label' },
  { story: 'ConnectWallet', section: 'Button Variants', description: 'default, outline, ghost, soft' },
  { story: 'ConnectWallet', section: 'Compact Variants', description: '32px size for navbars' },
  { story: 'ConnectWallet', section: 'Dot Loading Animation' },
  { story: 'ConnectWallet', section: 'Avatar Fallback', description: 'Hash-based gradient' },
  { story: 'ConnectWallet', section: 'Hide Balance' },
  { story: 'ConnectWallet', section: 'Hide Avatar' },
  { story: 'ConnectWallet', section: 'Show Fiat', description: 'Fiat equivalent next to balance' },
  { story: 'ConnectWallet', section: 'Chain Enforcement (Sepolia)', description: 'Wrong chain handling' },
  { story: 'ConnectWallet', section: 'Custom Address Format', description: 'formatAddress prop' },
  { story: 'ConnectWallet', section: 'Custom Labels (Spanish)', description: 'i18n via labels prop' },
  { story: 'ConnectWallet', section: 'Custom Render', description: 'children-as-function' },
  { story: 'ConnectWallet', section: 'Headless Hook', description: 'useWalletState' },
  { story: 'TokenBalance', section: 'Interactive', description: 'Toggle props live' },
  { story: 'TokenBalance', section: 'Default (Native ETH)' },
  { story: 'TokenBalance', section: 'ERC-20 (USDC)' },
  { story: 'TokenBalance', section: 'Row Variant', description: 'Token list layout' },
  { story: 'TokenBalance', section: 'Loading State', description: 'Skeleton pulse' },
  { story: 'TokenBalance', section: 'Zero Balance' },
  { story: 'TokenBalance', section: 'Error State' },
  { story: 'TokenBalance', section: 'Hide Fiat' },
  { story: 'TokenBalance', section: 'Hide Symbol' },
  { story: 'TokenBalance', section: 'EUR Currency' },
  { story: 'TokenBalance', section: 'Custom Address (vitalik.eth)', description: 'No wallet needed' },
  { story: 'TokenBalance', section: 'Custom Render', description: 'children-as-function' },
  { story: 'TokenBalance', section: 'Block-Based Refresh', description: 'Live block watcher' },
  { story: 'TokenBalance', section: 'Headless Hook', description: 'useTokenBalance' },
  { story: 'TransactionButton', section: 'State Machine', description: '12 states lifecycle' },
  { story: 'TransactionButton', section: 'Interactive', description: 'Toggle props live' },
  { story: 'TransactionButton', section: 'Simple ETH Transfer', description: 'Single-step flow states' },
  { story: 'TransactionButton', section: 'Multi-Step: Approve + Execute', description: 'approveAndExecute helper' },
  { story: 'TransactionButton', section: 'Safety Delay', description: '5-second countdown' },
  { story: 'TransactionButton', section: 'Simulation Failed', description: 'Pre-sign simulation' },
  { story: 'TransactionButton', section: 'Rejected by User' },
  { story: 'TransactionButton', section: 'Compound Components', description: 'FlowSteps + FlowProgress' },
  { story: 'TransactionButton', section: 'Custom Render', description: 'children-as-function' },
  { story: 'TransactionButton', section: 'Balance Refresh', description: 'After-tx invalidation' },
  { story: 'TransactionButton', section: 'Headless Hook', description: 'useTransactionFlow' },
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
      { name: 'size', type: "'default' | 'compact'", default: '"default"', description: 'Button size - compact is 32px for tight navbars' },
      { name: 'variant', type: "'default' | 'outline' | 'ghost' | 'soft'", default: '"default"', description: 'Visual style variant' },
      { name: 'chainId', type: 'number', description: 'Required chain ID - shows switch network if mismatched' },
      { name: 'labels', type: 'Partial<Labels>', description: 'Override all UI text strings for i18n' },
      { name: 'showBalance', type: 'boolean', default: 'true', description: 'Show ETH balance when connected' },
      { name: 'showFiat', type: 'boolean', default: 'false', description: 'Show fiat equivalent next to balance' },
      { name: 'showAvatar', type: 'boolean', default: 'true', description: 'Show avatar/ENS avatar when connected' },
      { name: 'showEns', type: 'boolean', default: 'true', description: 'Show ENS name instead of address' },
      { name: 'showChainSelector', type: 'boolean', default: 'true', description: 'Show chain selector in dropdown' },
      { name: 'avatarStyle', type: "'gradient' | 'pixel'", default: '"gradient"', description: 'Fallback avatar style when no ENS avatar' },
      { name: 'onConnect', type: '(data) => void', description: 'Called after successful connection' },
      { name: 'onDisconnect', type: '() => void', description: 'Called after disconnect' },
      { name: 'onError', type: '(error) => void', description: 'Called on connection error' },
      { name: 'formatAddress', type: '(address, ensName?) => string', description: 'Custom address display format' },
      { name: 'children', type: '(data) => ReactNode', description: 'Render function for full control' },
    ],
  },
  TokenBalance: {
    importPath: '@txkit/react',
    props: [
      { name: 'variant', type: "'inline' | 'row'", default: '"inline"', description: 'Layout - inline for embedding, row for token lists' },
      { name: 'token', type: 'Address', description: 'ERC-20 contract address. Omit for native ETH' },
      { name: 'address', type: 'Address', description: 'Wallet address to check. Defaults to connected wallet' },
      { name: 'name', type: 'string', description: 'Display name for row variant (e.g. "USD Coin")' },
      { name: 'icon', type: 'string', description: 'Token icon URL' },
      { name: 'chainId', type: 'number', description: 'Chain to query balance on. Defaults to connected chain' },
      { name: 'showFiat', type: 'boolean', default: 'true', description: 'Show USD/fiat equivalent' },
      { name: 'showIcon', type: 'boolean', default: 'false', description: 'Show token icon' },
      { name: 'showSymbol', type: 'boolean', default: 'true', description: 'Show token symbol (ETH, USDC)' },
      { name: 'fiatCurrency', type: 'string', default: '"USD"', description: 'Fiat currency code (USD, EUR, GBP)' },
      { name: 'price', type: 'number', description: 'Manual price override (skip DeFiLlama)' },
      { name: 'refetchInterval', type: 'number', description: 'Balance polling interval in ms' },
      { name: 'labels', type: 'Partial<Labels>', description: 'Override default UI text strings' },
      { name: 'formatOptions', type: 'FormatOptions', description: 'Number formatting (dust threshold, locale)' },
      { name: 'onError', type: '(error) => void', description: 'Called when balance fetch fails' },
      { name: 'onBalanceChange', type: '(balance, prev) => void', description: 'Called when balance changes' },
      { name: 'children', type: '(data) => ReactNode', description: 'Render function for full control' },
    ],
  },
  TransactionButton: {
    importPath: '@txkit/react',
    props: [
      { name: 'steps', type: 'FlowStep[]', required: true, description: 'Step definitions for this transaction flow' },
      { name: 'label', type: 'string', description: 'Button label text' },
      { name: 'labels', type: 'Partial<Labels>', description: 'Override default UI text strings' },
      { name: 'flowId', type: 'string', default: '"__default__"', description: 'Flow ID for parallel flows' },
      { name: 'chainId', type: 'number', description: 'Target chain - auto-switches if mismatched' },
      { name: 'safety', type: 'SafetyConfig', description: 'Simulation, delay timer, risk provider, MAX approval warning' },
      { name: 'confirmations', type: 'number', default: '1', description: 'Block confirmations per step' },
      { name: 'resetDelay', type: 'number', default: '0', description: 'Auto-reset to idle after completion (ms). 0 = no reset' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the button' },
      { name: 'showExplorerLink', type: 'boolean', default: 'true', description: 'Show explorer link after tx' },
      { name: 'onFlowComplete', type: '(results) => void', description: 'Called when entire flow completes' },
      { name: 'onStepComplete', type: '(stepId, result) => void', description: 'Called on any step completion' },
      { name: 'onError', type: '(error, stepId) => void', description: 'Called on any step error' },
      { name: 'onFlowStatusChange', type: '(status) => void', description: 'Called on every flow status change' },
      { name: 'children', type: '(data) => ReactNode', description: 'Render function for full control' },
    ],
  },
} as const


// --- Component descriptions ---

export type ComponentDescription = {
  summary: string
  features?: readonly string[]
  useWhen?: string
  docsPath?: string
}

export const componentDescriptions: Record<string, ComponentDescription> = {
  TxKitProvider: {
    summary: 'Root provider that wires wagmi, TanStack Query, theming, and transaction flow state together. All other txKit components must be wrapped in it.',
    features: [
      'Standalone mode: creates its own wagmi + QueryClient',
      'Embedded mode: plugs into your existing WagmiProvider (RainbowKit, ConnectKit, custom)',
      'Theme switching via CSS classes (.txkit-light / .txkit-dark / .txkit-sharp / .txkit-soft / .txkit-rounded)',
      'Shared flow store - FlowSteps, FlowProgress, and FlowToast auto-connect',
      'Nested-provider detection throws a typed error with a docs link',
    ],
    useWhen: 'Always - root of every app using txKit. Standalone for greenfield projects, embedded to add txKit alongside RainbowKit/AppKit/ConnectKit.',
    docsPath: '/api/txkit-provider',
  },
  ConnectWallet: {
    summary: 'Drop-in wallet connect button with a five-state machine (disconnected, connecting, connected, wrong-chain, error).',
    features: [
      'EIP-6963 auto-detection of installed wallets + WalletConnect fallback',
      'ENS name and avatar resolution on mainnet',
      'Formatted native balance, copyable full address',
      'Chain enforcement with one-click switch via chainId prop',
      'Three-tier customization: zero-config, children render function, useWalletState hook',
    ],
    useWhen: 'You want a turnkey connect UX. For apps that already ship RainbowKit or AppKit, use embedded mode on TxKitProvider and keep your existing connector.',
    docsPath: '/api/connect-wallet',
  },
  TokenBalance: {
    summary: 'Inline balance display for native currency or any ERC-20. One component, batch multicall behind the scenes.',
    features: [
      'Native ETH (wagmi useBalance) or ERC-20 via multicall - one RPC for N tokens',
      'Progressive formatting: 5 decimals → k/m/b suffixes with dust threshold',
      'Fiat conversion via DeFiLlama + multi-currency forex (frankfurter.app fallback)',
      'Block-based refresh with targeted cache invalidation',
      'onBalanceChange callback and useTokenBalance headless hook',
    ],
    useWhen: 'Anywhere a balance is visible. Cheap to mount repeatedly - TanStack Query dedupes identical reads.',
    docsPath: '/api/token-balance',
  },
  TransactionButton: {
    summary: 'Multi-step transaction executor for approve → sign → send → wait flows, with anti-phishing built in.',
    features: [
      'N steps (tx or sign) with a 12-state machine per step',
      'Pre-sign simulation via eth_call + decoded calldata preview',
      'MAX_UINT256 approval warning, optional safety delay timer',
      'Cascade cancel on step failure, cached signatures on retry',
      'Compound components - drop FlowSteps, FlowProgress, FlowToast anywhere in the tree',
    ],
    useWhen: 'Any on-chain action more complex than a single transaction - swaps, stakes, bridges, multi-approve flows.',
    docsPath: '/api/transaction-button',
  },
  ThemeShowcase: {
    summary: 'Interactive grid of 4 color schemes × 4 variants × 2 themes (32 combinations), with a Copy Theme panel that outputs ready-to-paste CSS variables.',
    features: [
      'Four brand hues: indigo (canonical), violet, emerald, amber',
      'Four border-radius variants: default, soft, sharp, rounded',
      'Switch between light and dark previews',
      'Copy OKLCH tokens for any combination',
    ],
  },
}


// --- Bundle size data ---

export const bundleSizes: Record<string, { js: string; css: string }> = {
  ConnectWallet: { js: '4.8 kB', css: '2.1 kB' },
  TokenBalance: { js: '4.6 kB', css: '2.1 kB' },
  TransactionButton: { js: '6.5 kB', css: '2.1 kB' },
  TxKitProvider: { js: '2.1 kB', css: '0.3 kB' },
}
