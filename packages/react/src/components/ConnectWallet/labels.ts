export type ConnectWalletLabels = {
  /** Button text in disconnected state */
  connect?: string
  /** Button text while connection is pending */
  connecting?: string
  /** Button text when user is on wrong chain */
  wrongChain?: string
  /** Button text for chain switch action */
  switchChain?: string
  /** Mismatch banner action (dropdown top row). `{chain}` placeholder is replaced with required chain name */
  switchTo?: string
  /** Dropdown menu disconnect button text */
  disconnect?: string
  /** Dropdown menu copy address button text */
  copyAddress?: string
  /** Shown after address is copied to clipboard */
  copied?: string
  /** Button text when connection fails */
  error?: string
  /** Button text for retry after error */
  retry?: string
  /** Modal title for wallet selection */
  selectWallet?: string
  /** Modal link text for wallet info */
  whatIsWallet?: string
  /** Dropdown menu explorer link text */
  explorer?: string
  /** Wallet search placeholder */
  searchWallets?: string
  /** Group header: installed wallets */
  installedWallets?: string
  /** Group header: recent wallets */
  recentWallets?: string
  /** Group header: popular wallets */
  popularWallets?: string
  /** Group header: all wallets */
  allWallets?: string
  /** Connecting detail: opening wallet */
  openingWallet?: string
  /** Connecting detail: approve in wallet */
  approveInWallet?: string
  /** Timeout hint */
  takingTooLong?: string
  /** Try different wallet link */
  tryDifferent?: string
  /** Chain selector title */
  switchNetwork?: string
  /** Fallback chain label when current chain is not in wagmi config */
  unknownChain?: string
  /** QR code instruction */
  scanWithPhone?: string
  /** Copy WalletConnect URI button text */
  copyLink?: string
  /** Prefix shown before the dApp origin in wallet modal (anti-phishing) */
  connectingTo?: string
  /** ARIA label for the account dropdown menu (screen readers) */
  menuLabel?: string
  /** ARIA label for the back-arrow button on the connecting view */
  backToWalletList?: string
  /** ARIA label for the wallet modal close button */
  close?: string
  /** Message shown when search yields no matching wallets */
  noWalletsFound?: string
  /** Message shown when no wallets are configured at all */
  noWalletsAvailable?: string
}

export const defaultLabels: Required<ConnectWalletLabels> = {
  connect: 'Connect Wallet',
  connecting: 'Connecting',
  wrongChain: 'Wrong Network',
  switchChain: 'Switch Network',
  switchTo: 'Switch to {chain}',
  disconnect: 'Disconnect',
  copyAddress: 'Copy Address',
  copied: 'Copied!',
  error: 'Connection Failed',
  retry: 'Try Again',
  selectWallet: 'Select Wallet',
  whatIsWallet: 'What is a wallet?',
  explorer: 'Explorer',
  searchWallets: 'Search wallets...',
  installedWallets: 'Installed',
  recentWallets: 'Recent',
  popularWallets: 'Popular',
  allWallets: 'All Wallets',
  openingWallet: 'Opening {wallet}...',
  approveInWallet: 'Approve in {wallet}',
  takingTooLong: 'Taking too long?',
  tryDifferent: 'Try a different wallet',
  switchNetwork: 'Switch Network',
  unknownChain: 'Unknown Network',
  scanWithPhone: 'Scan with your phone',
  copyLink: 'Copy Link',
  connectingTo: 'Connecting to',
  menuLabel: 'Account actions',
  backToWalletList: 'Back to wallet list',
  close: 'Close',
  noWalletsFound: 'No wallets found',
  noWalletsAvailable: 'No wallets available',
}
