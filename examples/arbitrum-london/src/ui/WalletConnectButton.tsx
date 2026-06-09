'use client'

import { ConnectWallet } from '@txkit/react'


type WalletConnectButtonProps = {
  chainId?: number,
}


/**
 * Client boundary for the header connect control. The route pages are server
 * components and @txkit/react ships without a 'use client' banner, so
 * ConnectWallet (and its hooks + error boundary) must be imported from inside a
 * client module.
 *
 * Renders the real @txkit/react <ConnectWallet />, reading the embedded
 * TxKitProvider mounted in providers.tsx on the shared wagmi instance. Pass
 * chainId to pin a scenario chain (Arbitrum Sepolia for yield-swap, Robinhood
 * Chain for rwa-buy) so the button surfaces txKit's wrong-network connect +
 * switch UX. Omit it on the chain-agnostic landing for a plain connect.
 */
export const WalletConnectButton = ({ chainId }: WalletConnectButtonProps) => {

  return <ConnectWallet chainId={chainId} size="compact" />
}
