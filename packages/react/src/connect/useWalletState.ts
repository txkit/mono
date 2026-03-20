import { useMemo } from 'react'
import type { Chain } from 'viem'
import {
  useAccount,
  useConnect,
  useBalance,
  useEnsName,
  useDisconnect,
  useEnsAvatar,
  useSwitchChain,
  type Connector,
} from 'wagmi'
import { shortenAddress, formatTokenAmount } from '@txkit/core'


/** Wallet connection state machine states */
export type WalletState = 'disconnected' | 'connecting' | 'connected' | 'wrong-chain' | 'error'

export type UseWalletStateOptions = {
  /** Force specific chain. Shows wrong-chain state if mismatch */
  chainId?: number
  /** Fetch and display native balance. @default true */
  showBalance?: boolean
  /** Resolve ENS name and avatar. @default true */
  showEns?: boolean
}

export type UseWalletStateReturn = {
  /** Current connection state */
  state: WalletState
  /** Connected wallet address */
  address: `0x${string}` | undefined
  /** Shortened address or ENS name */
  displayAddress: string | undefined
  /** ENS name (resolved on mainnet) */
  ensName: string | null | undefined
  /** ENS avatar URL */
  ensAvatar: string | null | undefined
  /** Formatted native balance with symbol (e.g. "1.23 ETH") */
  formattedBalance: string | undefined
  /** Current chain */
  chain: Chain | undefined
  /** Active connector */
  connector: Connector | undefined
  /** Available wallet connectors */
  connectors: readonly Connector[]
  /** Initiate wallet connection */
  connect: ReturnType<typeof useConnect>['connect']
  /** Disconnect wallet */
  disconnect: ReturnType<typeof useDisconnect>['disconnect']
  /** Switch to a different chain */
  switchChain: ReturnType<typeof useSwitchChain>['switchChain']
  /** Connection error */
  error: Error | null
  /** True while connection is pending */
  isPending: boolean
}

const useWalletState = (options: UseWalletStateOptions = {}): UseWalletStateReturn => {
  const { chainId, showBalance = true, showEns = true } = options

  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const { address, isConnected, chain, connector } = useAccount()
  const { connect, connectors, isPending, error: connectError } = useConnect()

  const { data: ensName } = useEnsName({
    address,
    chainId: 1,
    query: { enabled: showEns && Boolean(address) },
  })

  const { data: ensAvatar } = useEnsAvatar({
    name: ensName ?? undefined,
    chainId: 1,
    query: { enabled: showEns && Boolean(ensName) },
  })

  const { data: balanceData } = useBalance({
    address,
    query: { enabled: showBalance && Boolean(address) },
  })

  const state: WalletState = useMemo(() => {
    if (connectError && !isPending && !isConnected) {
      return 'error'
    }
    if (isPending) {
      return 'connecting'
    }
    if (isConnected && chainId && chain?.id !== chainId) {
      return 'wrong-chain'
    }
    if (isConnected) {
      return 'connected'
    }
    return 'disconnected'
  }, [ connectError, isPending, isConnected, chainId, chain?.id ])

  const formattedBalance = useMemo(() => {
    if (!balanceData) {
      return undefined
    }

    return `${formatTokenAmount(balanceData.value, balanceData.decimals)} ${balanceData.symbol}`
  }, [ balanceData ])

  const displayAddress = useMemo(() => {
    if (!address) {
      return undefined
    }

    return ensName ?? shortenAddress(address)
  }, [ address, ensName ])

  return {
    state,
    address,
    displayAddress,
    ensName,
    ensAvatar,
    formattedBalance,
    chain,
    connector,
    connectors,
    connect,
    disconnect,
    switchChain,
    error: connectError,
    isPending,
  }
}


export default useWalletState
