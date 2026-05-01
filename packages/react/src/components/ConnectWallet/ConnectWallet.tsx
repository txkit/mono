'use client'
import React, { useRef, useMemo, useState, useEffect, useCallback, forwardRef } from 'react'
import { formatUnits } from 'viem'
import type { Connector } from 'wagmi'
import { cx, formatFiatAmount } from '@txkit/core'

import useDeepMemo from '../../hooks/useDeepMemo'
import useTokenPrice from '../../hooks/useTokenPrice'
import useWalletState from '../../hooks/useWalletState'
import useRecentWallets from './utils/useRecentWallets'
import useWalletGroups from './utils/useWalletGroups'
import { useTxKit } from '../TxKitProvider/TxKitProvider'
import { defaultLabels } from './labels'
import ConnectWalletDefault from './ConnectWalletDefault'
import type { ConnectWalletLabels } from './labels'
import type { ConnectWalletProps, ConnectWalletRenderData } from '../../types/connect'
import './ConnectWallet.css'


export { type ConnectWalletLabels }

const connectedStates: readonly string[] = [ 'connected', 'wrong-chain' ]
const modalOpenStates: readonly string[] = [ 'disconnected', 'connecting', 'error' ]

const ConnectWallet = forwardRef<HTMLDivElement, ConnectWalletProps>(({
  className,
  children,
  'data-testid': testId,
  label,
  chainId,
  labels: labelOverrides,
  showEns = true,
  showAvatar = true,
  showBalance = true,
  showFiat = false,
  size = 'default',
  variant = 'default',
  avatarStyle = 'gradient',
  onError,
  onConnect,
  onDisconnect,
  onRequestConnect,
  formatAddress,
}, ref) => {
  const [ panel, setPanel ] = useState<'closed' | 'modal' | 'dropdown'>('closed')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const prevConnectedRef = useRef(false)
  const onErrorRef = useRef(onError)
  const onConnectRef = useRef(onConnect)
  const onDisconnectRef = useRef(onDisconnect)
  const onRequestConnectRef = useRef(onRequestConnect)

  onErrorRef.current = onError
  onConnectRef.current = onConnect
  onDisconnectRef.current = onDisconnect
  onRequestConnectRef.current = onRequestConnect

  const [ selectedConnector, setSelectedConnector ] = useState<Connector | undefined>(undefined)

  const mergedLabels = useDeepMemo(
    () => ({ ...defaultLabels, ...labelOverrides }),
    [ labelOverrides ],
  )

  const {
    chain,
    state,
    error,
    address,
    connect,
    ensName,
    ensAvatar,
    connector,
    connectors,
    disconnect,
    isTimedOut,
    switchChain,
    balanceValue,
    displayAddress,
    balanceDecimals,
    formattedBalance,
  } = useWalletState({
    chainId,
    showEns,
    showBalance: showBalance || showFiat,
    connectingConnectorId: selectedConnector?.id,
  })

  const { price } = useTokenPrice({
    chainId: chain?.id,
    fiatCurrency: 'USD',
    enabled: showFiat && Boolean(address),
  })

  const fiatBalance = useMemo(() => {
    if (!showFiat || balanceValue === undefined || balanceDecimals === undefined || !price) {
      return undefined
    }
    const amount = Number(formatUnits(balanceValue, balanceDecimals))
    return formatFiatAmount(amount * price, 'USD')
  }, [ price, showFiat, balanceValue, balanceDecimals ])

  const { config } = useTxKit()
  const chains = config.displayChains

  const requiredChain = useMemo(() => {
    if (!chainId) {
      return undefined
    }
    return config.chains.find((chain) => chain.id === chainId)
      ?? chains.find((chain) => chain.id === chainId)
  }, [ chainId, chains, config.chains ])

  const { recentIds, addRecent } = useRecentWallets()
  const groupedConnectors = useWalletGroups({ connectors, recentIds })

  useEffect(() => {
    if (state !== 'connecting') {
      setSelectedConnector(undefined)
    }
  }, [ state ])

  const connectingWallet = state === 'connecting' ? selectedConnector?.name : undefined

  useEffect(() => {
    const isConnected = connectedStates.includes(state)
    const wasConnected = prevConnectedRef.current

    if (isConnected && !wasConnected && address) {
      onConnectRef.current?.({ address, connector: connector?.name ?? '' })
    }
    else if (!isConnected && wasConnected) {
      onDisconnectRef.current?.()
    }

    prevConnectedRef.current = isConnected
  }, [ state, address, connector ])

  useEffect(() => {
    if (error) {
      onErrorRef.current?.(error)
    }
  }, [ error ])

  useEffect(() => {
    if (!connectedStates.includes(state) && panel === 'dropdown') {
      setPanel('closed')
    }
    if (!modalOpenStates.includes(state) && panel === 'modal') {
      setPanel('closed')
    }
  }, [ state, panel ])

  const handleButtonClick = useCallback(() => {
    switch (state) {
      case 'disconnected':
      case 'error':
        if (onRequestConnectRef.current?.() === true) {
          return
        }
        setPanel('modal')
        break
      case 'connected':
      case 'wrong-chain':
        setPanel((prev) => prev === 'dropdown' ? 'closed' : 'dropdown')
        break
    }
  }, [ state ])

  const handleModalSelect = useCallback((modalConnector: Connector) => {
    setSelectedConnector(modalConnector)
    connect({ connector: modalConnector })
    addRecent(modalConnector.id)
  }, [ connect, addRecent ])

  const handleModalClose = useCallback(() => {
    setPanel('closed')
    buttonRef.current?.focus()
  }, [])

  const handleCancelConnect = useCallback(() => {
    disconnect()
  }, [ disconnect ])

  const handleDisconnect = useCallback(() => {
    disconnect()
    setPanel('closed')
  }, [ disconnect ])

  const resolvedDisplayAddress = useMemo(() => {
    if (!address) {
      return undefined
    }
    if (formatAddress) {
      return formatAddress(address, ensName ?? undefined)
    }
    return displayAddress
  }, [ address, ensName, formatAddress, displayAddress ])

  const statusMessage = useMemo(() => {
    switch (state) {
      case 'connected': return `Connected: ${resolvedDisplayAddress}`
      case 'error': return mergedLabels.error
      case 'wrong-chain':
        return `${mergedLabels.wrongChain}: on ${chain?.name ?? '?'}, needs ${requiredChain?.name ?? '?'}`
      default: return ''
    }
  }, [ state, mergedLabels, resolvedDisplayAddress, chain, requiredChain ])

  const buttonLabel = useMemo(() => {
    switch (state) {
      case 'disconnected': return label ?? mergedLabels.connect
      case 'connecting': return mergedLabels.connecting
      case 'error': return mergedLabels.retry
      default: return null
    }
  }, [ label, state, mergedLabels ])

  const openModal = useCallback(() => setPanel('modal'), [])
  const closePanel = useCallback(() => setPanel('closed'), [])

  const handleConnect = useCallback(
    (connector: Connector) => connect({ connector }),
    [ connect ],
  )

  const handleSwitchChain = useCallback(
    (id: number) => switchChain({ chainId: id }),
    [ switchChain ],
  )

  const renderData: ConnectWalletRenderData = useMemo(() => ({
    state,
    address,
    displayAddress: resolvedDisplayAddress,
    ensName,
    ensAvatar,
    formattedBalance,
    fiatBalance,
    chain,
    requiredChain,
    chains,
    connectors,
    groupedConnectors,
    connectingWallet,
    connect: handleConnect,
    disconnect: handleDisconnect,
    switchChain: handleSwitchChain,
    openModal,
    closePanel,
    error,
    isPending: state === 'connecting',
    isTimedOut,
    isWrongChain: state === 'wrong-chain',
  }), [
    chain, chains, state, error, address, ensName, ensAvatar, openModal,
    connectors, closePanel, isTimedOut, handleConnect, handleDisconnect,
    connectingWallet, formattedBalance, groupedConnectors, handleSwitchChain,
    resolvedDisplayAddress, requiredChain, fiatBalance,
  ])

  return (
    <div
      ref={ref}
      className={cx('tx-cw', className)}
      data-testid={testId}
      data-size={size}
      data-variant={variant}
    >
      {
        typeof children === 'function'
          ? children(renderData)
          : (
            <ConnectWalletDefault
              buttonRef={buttonRef}
              state={state}
              panel={panel}
              address={address}
              ensName={ensName}
              ensAvatar={ensAvatar}
              buttonLabel={buttonLabel}
              statusMessage={statusMessage}
              formattedBalance={formattedBalance}
              fiatBalance={fiatBalance}
              resolvedDisplayAddress={resolvedDisplayAddress}
              chain={chain}
              requiredChain={requiredChain}
              chains={chains}
              connectors={connectors}
              groupedConnectors={groupedConnectors}
              recentIds={recentIds}
              connectingWallet={connectingWallet}
              isTimedOut={isTimedOut}
              mergedLabels={mergedLabels}
              size={size}
              variant={variant}
              showAvatar={showAvatar}
              showBalance={showBalance}
              showFiat={showFiat}
              avatarStyle={avatarStyle}
              onModalClose={handleModalClose}
              onDisconnect={handleDisconnect}
              onPanelClose={closePanel}
              onButtonClick={handleButtonClick}
              onModalSelect={handleModalSelect}
              onChainSwitch={handleSwitchChain}
              onCancelConnect={handleCancelConnect}
            />
          )
      }
    </div>
  )
})

ConnectWallet.displayName = 'ConnectWallet'


export default ConnectWallet
