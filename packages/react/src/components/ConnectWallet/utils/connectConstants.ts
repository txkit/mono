/** Well-known wallet connector RDNSes for grouping (EIP-6963) */
export const POPULAR_WALLET_RDNS: readonly string[] = [
  'io.metamask',
  'com.coinbase.wallet',
  'me.rainbow',
  'io.rabby',
  'app.phantom',
]

/** Max number of recent wallets stored in localStorage */
export const MAX_RECENT_WALLETS = 3

/** localStorage key for recent wallet IDs */
export const RECENT_WALLETS_KEY = 'tx-recent-wallets'

/** Connection timeout in ms before showing "Taking too long?" (injected wallets) */
export const CONNECTION_TIMEOUT_MS = 15_000

/** Connection timeout in ms for QR code flow (WalletConnect) - longer for scan + confirm */
export const QR_TIMEOUT_MS = 60_000

/** Wallet search threshold - show search input when this many wallets */
export const SEARCH_THRESHOLD = 6
