'use client'

import { ConnectWallet } from '@txkit/react'

import { arbitrumSepolia } from '@/src/chains'


/**
 * Client boundary for the header connect control. flow-a/page.tsx is a server
 * component and @txkit/react ships without a 'use client' banner, so ConnectWallet
 * (and its hooks + error boundary) must be imported from inside a client module.
 *
 * This renders the real @txkit/react <ConnectWallet />, reading the embedded
 * TxKitProvider mounted in providers.tsx on the shared wagmi instance. chainId is
 * pinned to Arbitrum Sepolia (this scenario's chain) so the button surfaces
 * txKit's wrong-network UX if the wallet is elsewhere; executeEnvelope still
 * switches at sign time.
 */
export const WalletConnectButton = () => {

  return <ConnectWallet chainId={arbitrumSepolia.id} size="compact" />
}
