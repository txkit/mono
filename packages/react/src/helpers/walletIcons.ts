/**
 * Fallback SVG icons for known wallet connectors that don't provide their own icon.
 *
 * EIP-6963 wallets (browser extensions) supply icons automatically.
 * SDK connectors (coinbaseWalletSDK, walletConnect) do not - they need fallbacks.
 *
 * Brand colours are hardcoded in the .svg files - these are brand assets, not theming targets.
 * Source: simplified from official brand assets.
 */

import coinbaseIcon from '../assets/icons/wallet-coinbase.svg'
import walletConnectIcon from '../assets/icons/wallet-wallet-connect.svg'
import metaMaskIcon from '../assets/icons/wallet-metamask.svg'
import rabbyIcon from '../assets/icons/wallet-rabby.svg'
import rainbowIcon from '../assets/icons/wallet-rainbow.svg'
import phantomIcon from '../assets/icons/wallet-phantom.svg'


/**
 * Fallback icon map keyed by connector id or rdns.
 * Used when connector.icon is not available (SDK connectors without EIP-6963).
 */
export const WALLET_FALLBACK_ICONS: Record<string, string> = {
  coinbaseWalletSDK: coinbaseIcon,
  walletConnect: walletConnectIcon,

  'io.metamask': metaMaskIcon,
  'io.rabby': rabbyIcon,
  'me.rainbow': rainbowIcon,
  'app.phantom': phantomIcon,
  'com.coinbase.wallet': coinbaseIcon,
}
