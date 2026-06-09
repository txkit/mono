import { useMemo, useState, useEffect, useRef } from 'react'
import { UserRejectedRequestError, type Chain } from 'viem'
import {
  useConnection,
  useConnect,
  useConnectors,
  useBalance,
  useEnsName,
  useDisconnect,
  useEnsAvatar,
  useSwitchChain,
  type Connector,
} from 'wagmi'
import { shortenAddress, formatTokenAmount } from '@txkit/core'

import { CONNECTION_TIMEOUT_MS, QR_TIMEOUT_MS } from '../components/ConnectWallet/utils/connectConstants'


/** Wallet connection state machine states */
export type WalletState = 'disconnected' | 'reconnecting' | 'connecting' | 'connected' | 'wrong-chain' | 'error'

export type UseWalletStateOptions = {
  /** Force specific chain. Shows wrong-chain state if mismatch */
  chainId?: number
  /** Fetch and display native balance. @default true */
  showBalance?: boolean
  /** Resolve ENS name and avatar. @default true */
  showEns?: boolean
  /** ID of the connector currently being connected (for timeout selection) */
  connectingConnectorId?: string
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
  /** Raw native balance in wei */
  balanceValue: bigint | undefined
  /** Native balance decimals (18 for ETH) */
  balanceDecimals: number | undefined
  /** Native balance symbol (ETH, MATIC, etc.) */
  balanceSymbol: string | undefined
  /** Current chain */
  chain: Chain | undefined
  /** Active connector */
  connector: Connector | undefined
  /** Available wallet connectors */
  connectors: readonly Connector[]
  /** Initiate wallet connection */
  connect: ReturnType<typeof useConnect>['mutate']
  /** Disconnect wallet */
  disconnect: ReturnType<typeof useDisconnect>['mutate']
  /** Switch to a different chain */
  switchChain: ReturnType<typeof useSwitchChain>['mutate']
  /** Connection error */
  error: Error | null
  /** True while connection is pending */
  isPending: boolean
  /** True when connecting has exceeded timeout threshold */
  isTimedOut: boolean
  /** True while the native balance query is loading - drives a reserved-width skeleton */
  isBalanceLoading: boolean
}

const useWalletState = (options: UseWalletStateOptions = {}): UseWalletStateReturn => {
  const { chainId, showBalance = true, showEns = true, connectingConnectorId } = options

  const [ isTimedOut, setTimedOut ] = useState(false)
  const [ isMounted, setMounted ] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const { mutate: disconnect } = useDisconnect()
  const { mutate: switchChain } = useSwitchChain()
  const { address, isConnected, chainId: connectedChainId, chain, connector, isReconnecting } = useConnection()
  const connectors = useConnectors()
  const { mutate: connect, isPending, error: connectError } = useConnect()

  // Connection timeout detection - WalletConnect QR flow needs longer timeout
  const timeoutMs = connectingConnectorId === 'walletConnect' ? QR_TIMEOUT_MS : CONNECTION_TIMEOUT_MS

  useEffect(() => {
    if (isPending) {
      setTimedOut(false)
      timeoutRef.current = setTimeout(() => setTimedOut(true), timeoutMs)
    }
    else {
      setTimedOut(false)
      clearTimeout(timeoutRef.current)
    }

    return () => clearTimeout(timeoutRef.current)
  }, [ isPending, timeoutMs ])

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
    address,
    query: { enabled: showBalance && Boolean(address) },
  })

  // User rejection (EIP-1193 code 4001) is not an error - user explicitly
  // declined the connection in their wallet. Return to disconnected silently.
  const isUserRejection = Boolean(
    connectError && connectError instanceof UserRejectedRequestError
  )


  const state: WalletState = useMemo(() => {
    if (connectError && !isPending && !isConnected && !isUserRejection) {
      return 'error'
    }
    if (isPending) {
      return 'connecting'
    }
    // Compare against the raw connectedChainId from useConnection rather
    // than chain?.id. `chain` is the resolved viem Chain object and is
    // undefined when the connected network isn't in the wagmi config
    // (e.g. a testnet the user switched to manually) or during the brief
    // reconnecting hydration window - both cases flashed 'wrong-chain'
    // spuriously. `connectedChainId` is the wallet-reported id, present
    // whenever we actually know the chain.
    if (isConnected && chainId && connectedChainId !== undefined && connectedChainId !== chainId) {
      return 'wrong-chain'
    }
    if (isConnected) {
      return 'connected'
    }
    // Before mount (SSR/hydration) and while wagmi restores a prior session,
    // show the skeleton instead of flashing the disconnected "Connect" label.
    if (!isMounted || isReconnecting) {
      return 'reconnecting'
    }
    return 'disconnected'
  }, [ connectError, isPending, isConnected, isUserRejection, chainId, connectedChainId, isMounted, isReconnecting ])

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

    if (showEns && ensName) {
      return ensName
    }

    return shortenAddress(address)
  }, [ showEns, address, ensName ])

  return {
    state,
    address,
    displayAddress,
    ensName,
    ensAvatar,
    formattedBalance,
    balanceValue: balanceData?.value,
    balanceDecimals: balanceData?.decimals,
    balanceSymbol: balanceData?.symbol,
    chain,
    connector,
    connectors,
    connect,
    disconnect,
    switchChain,
    error: isUserRejection ? null : connectError,
    isPending,
    isTimedOut,
    isBalanceLoading,
  }
}


export default useWalletState
