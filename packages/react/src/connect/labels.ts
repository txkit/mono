export type ConnectWalletLabels = {
  /** Button text in disconnected state */
  connect?: string
  /** Button text while connection is pending */
  connecting?: string
  /** Button text when user is on wrong chain */
  wrongChain?: string
  /** Button text for chain switch action */
  switchChain?: string
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
}

export const defaultLabels: Required<ConnectWalletLabels> = {
  connect: 'Connect Wallet',
  connecting: 'Connecting',
  wrongChain: 'Wrong Network',
  switchChain: 'Switch Network',
  disconnect: 'Disconnect',
  copyAddress: 'Copy Address',
  copied: 'Copied!',
  error: 'Connection Failed',
  retry: 'Try Again',
  selectWallet: 'Select Wallet',
  whatIsWallet: 'What is a wallet?',
  explorer: 'Explorer',
}
