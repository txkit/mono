'use client'

import { ConnectWallet } from '@txkit/react'


type WalletConnectButtonProps = {
  chainId: number,
}


/**
 * Client boundary for the header connect control. flow-a/page.tsx is a server
 * component and @txkit/react ships without a 'use client' banner, so ConnectWallet
 * (and its hooks + error boundary) must be imported from inside a client module.
 *
 * This renders the real @txkit/react <ConnectWallet />, reading the embedded
 * TxKitProvider mounted in providers.tsx on the shared wagmi instance. chainId is
 * pinned to the scenario's chain (Arbitrum Sepolia for flow-a, Robinhood Chain
 * for flow-c) so the button surfaces txKit's wrong-network connect + switch UX
 * when the wallet is on another chain.
 */
export const WalletConnectButton = ({ chainId }: WalletConnectButtonProps) => {

  return <ConnectWallet chainId={chainId} size="compact" />
}
