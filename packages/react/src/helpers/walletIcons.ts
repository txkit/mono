/**
 * Fallback SVG icons for known wallet connectors that don't provide their own icon.
 *
 * EIP-6963 wallets (browser extensions) supply icons automatically.
 * SDK connectors (coinbaseWalletSDK, walletConnect) do not - they need fallbacks.
 *
 * Icons are inline SVG data URIs to avoid external asset dependencies.
 * Source: simplified from official brand assets.
 */


/** Coinbase Wallet - blue circle with white "C" arc */
const coinbaseIcon = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" fill="none">'
  + '<rect width="56" height="56" rx="12" fill="#0052FF"/>'
  + '<path d="M28 6C15.85 6 6 15.85 6 28s9.85 22 22 22 22-9.85 22-22S40.15 6 28 6zm-5.5 18.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-7z" fill="#fff"/>'
  + '</svg>'
)

/** WalletConnect - blue background with white bridge icon */
const walletConnectIcon = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" fill="none">'
  + '<rect width="56" height="56" rx="12" fill="#3B99FC"/>'
  + '<path d="M17.39 22.02c5.86-5.74 15.36-5.74 21.22 0l.7.69a.72.72 0 0 1 0 1.04l-2.41 2.36a.38.38 0 0 1-.53 0l-.97-.95c-4.09-4-10.72-4-14.81 0l-1.04 1.02a.38.38 0 0 1-.53 0l-2.41-2.36a.72.72 0 0 1 0-1.04l.78-.76zm26.22 4.89 2.15 2.1a.72.72 0 0 1 0 1.04l-9.67 9.47a.76.76 0 0 1-1.06 0l-6.87-6.72a.19.19 0 0 0-.26 0l-6.87 6.72a.76.76 0 0 1-1.06 0L10.3 30.05a.72.72 0 0 1 0-1.04l2.15-2.1a.76.76 0 0 1 1.06 0l6.87 6.72c.07.07.19.07.26 0l6.87-6.72a.76.76 0 0 1 1.06 0l6.87 6.72c.07.07.19.07.26 0l6.87-6.72a.76.76 0 0 1 1.06 0z" fill="#fff"/>'
  + '</svg>'
)

/** MetaMask - fox icon (simplified) */
const metaMaskIcon = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" fill="none">'
  + '<rect width="56" height="56" rx="12" fill="#F5841F"/>'
  + '<path d="M40.5 15.5 30.8 22.7l1.8-4.2 7.9-3z" fill="#E2761B" stroke="#E2761B" stroke-width=".5"/>'
  + '<path d="m15.5 15.5 9.6 7.3-1.7-4.3-7.9-3zM37 34.5l-2.6 4 5.5 1.5 1.6-5.4-4.5-.1zM14.5 34.6l1.6 5.4 5.5-1.5-2.6-4-4.5.1z" fill="#E4761B" stroke="#E4761B" stroke-width=".5"/>'
  + '<path d="m21.3 25.1-1.5 2.3 5.4.2-.2-5.8-3.7 3.3zM34.7 25.1l-3.8-3.4-.1 5.9 5.4-.2-1.5-2.3z" fill="#E4761B" stroke="#E4761B" stroke-width=".5"/>'
  + '</svg>'
)

/** Rabby - rabbit icon (simplified) */
const rabbyIcon = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" fill="none">'
  + '<rect width="56" height="56" rx="12" fill="#7C82F2"/>'
  + '<path d="M28 14c-7.7 0-14 6.3-14 14s6.3 14 14 14 14-6.3 14-14-6.3-14-14-14zm-4 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm8 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-8 8h8s-1 3-4 3-4-3-4-3z" fill="#fff"/>'
  + '</svg>'
)

/** Rainbow - gradient rainbow arc */
const rainbowIcon = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" fill="none">'
  + '<rect width="56" height="56" rx="12" fill="#174299"/>'
  + '<path d="M14 36v-4a14 14 0 0 1 28 0v4h-4v-4a10 10 0 0 0-20 0v4h-4z" fill="#FF494A"/>'
  + '<path d="M18 36v-4a10 10 0 0 1 20 0v4h-4v-4a6 6 0 0 0-12 0v4h-4z" fill="#FF7849"/>'
  + '<path d="M22 36v-4a6 6 0 0 1 12 0v4h-4v-4a2 2 0 0 0-4 0v4h-4z" fill="#FFD63D"/>'
  + '</svg>'
)

/** Phantom - purple ghost */
const phantomIcon = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" fill="none">'
  + '<rect width="56" height="56" rx="12" fill="#AB9FF2"/>'
  + '<path d="M40 28c0-6.6-5.4-12-12-12s-12 5.4-12 12c0 1 0 8 4 8s4-4 4-4 0 4 4 4 4-4 4-4 0 4 4 4 4-8 4-8zm-16-2a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm8 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="#fff"/>'
  + '</svg>'
)


/**
 * Fallback icon map keyed by connector id or rdns.
 * Used when connector.icon is not available (SDK connectors without EIP-6963).
 */
export const WALLET_FALLBACK_ICONS: Record<string, string> = {
  // SDK connector IDs (from wagmi)
  coinbaseWalletSDK: coinbaseIcon,
  walletConnect: walletConnectIcon,

  // RDNS / EIP-6963 IDs (fallback if extension icon missing)
  'io.metamask': metaMaskIcon,
  'io.rabby': rabbyIcon,
  'me.rainbow': rainbowIcon,
  'app.phantom': phantomIcon,
  'com.coinbase.wallet': coinbaseIcon,
}
