'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'


const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

/**
 * Minimal wallet connect for the demo, on the example's own wagmi v2 instance
 * (the injected / MetaMask connector configured in providers). Kept native
 * instead of @txkit/react ConnectWallet because that package targets wagmi v3
 * and this example runs wagmi v2, so the two WagmiContexts would not match.
 *
 * Chain is not pinned here: SignEnvelopeActions sends executeEnvelope with the
 * envelope chainId, so wagmi prompts a network switch at sign time if needed.
 */
export const WalletConnectButton = () => {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  const handleConnect = () => {
    const connector = connectors[0]
    if (connector !== undefined) {
      connect({ connector })
    }
  }

  if (isConnected && address !== undefined) {

    return (
      <button
        type="button"
        onClick={() => disconnect()}
        title="Disconnect"
        className="rounded-md border border-border px-3 py-1.5 font-mono text-xs text-foreground hover:border-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {formatAddress(address)}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleConnect}
      disabled={isPending}
      className="rounded-md bg-accent px-4 py-1.5 text-xs text-accent-text hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
    >
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </button>
  )
}
