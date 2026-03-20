'use client'
import React, { useRef, useMemo, useState, useEffect, useCallback, forwardRef } from 'react'
import type { Connector } from 'wagmi'
import { cx } from '@txkit/core'

import useDeepMemo from '../hooks/useDeepMemo'
import useWalletState from './useWalletState'
import { defaultLabels } from './labels'
import ConnectWalletDefault from './ConnectWalletDefault'
import type { ConnectWalletLabels } from './labels'
import type { ConnectWalletProps, ConnectWalletRenderData } from './types'
import './ConnectWallet.css'


export { type ConnectWalletLabels }

const connectedStates: readonly string[] = [ 'connected', 'wrong-chain' ]

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
  onError,
  onConnect,
  onDisconnect,
  formatAddress,
}, ref) => {
  const [ panel, setPanel ] = useState<'closed' | 'modal' | 'dropdown'>('closed')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const prevConnectedRef = useRef(false)
  const onErrorRef = useRef(onError)
  const onConnectRef = useRef(onConnect)
  const onDisconnectRef = useRef(onDisconnect)

  onErrorRef.current = onError
  onConnectRef.current = onConnect
  onDisconnectRef.current = onDisconnect

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
    switchChain,
    displayAddress,
    formattedBalance,
  } = useWalletState({ chainId, showEns, showBalance })

  // onConnect / onDisconnect callbacks
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

  // onError callback
  useEffect(() => {
    if (error) {
      onErrorRef.current?.(error)
    }
  }, [ error ])

  // Close panel on state changes
  useEffect(() => {
    if (state !== 'connected' && panel === 'dropdown') {
      setPanel('closed')
    }
    if (state !== 'disconnected' && panel === 'modal') {
      setPanel('closed')
    }
  }, [ state, panel ])

  const handleButtonClick = useCallback(() => {
    switch (state) {
      case 'disconnected':
        setPanel('modal')
        break
      case 'connected':
        setPanel((prev) => prev === 'dropdown' ? 'closed' : 'dropdown')
        break
      case 'wrong-chain':
        if (chainId) {
          switchChain({ chainId })
        }
        break
      case 'error':
        setPanel('modal')
        break
    }
  }, [ state, chainId, switchChain ])

  const handleModalSelect = useCallback((connector: Parameters<typeof connect>[0]['connector']) => {
    connect({ connector })
  }, [ connect ])

  const handleModalClose = useCallback(() => {
    setPanel('closed')
    buttonRef.current?.focus()
  }, [])

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

  // Status message for aria-live
  const statusMessage = useMemo(() => {
    switch (state) {
      case 'connected': return `Connected: ${resolvedDisplayAddress}`
      case 'error': return mergedLabels.error
      case 'wrong-chain': return mergedLabels.wrongChain
      default: return ''
    }
  }, [ state, mergedLabels, resolvedDisplayAddress ])

  const buttonLabel = useMemo(() => {
    switch (state) {
      case 'disconnected': return label ?? mergedLabels.connect
      case 'connecting': return mergedLabels.connecting
      case 'wrong-chain': return mergedLabels.wrongChain
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
    chain,
    connectors,
    connect: handleConnect,
    disconnect: handleDisconnect,
    switchChain: handleSwitchChain,
    openModal,
    closePanel,
    error,
    isPending: state === 'connecting',
  }), [
    chain, state, error, address, ensName, ensAvatar, openModal,
    connectors, closePanel, handleConnect, handleDisconnect,
    formattedBalance, handleSwitchChain, resolvedDisplayAddress,
  ])

  return (
    <div ref={ref} className={cx('txkit-cw', className)} data-testid={testId}>
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
              resolvedDisplayAddress={resolvedDisplayAddress}
              chain={chain}
              connectors={connectors}
              mergedLabels={mergedLabels}
              showAvatar={showAvatar}
              showBalance={showBalance}
              onModalClose={handleModalClose}
              onDisconnect={handleDisconnect}
              onPanelClose={closePanel}
              onButtonClick={handleButtonClick}
              onModalSelect={handleModalSelect}
            />
          )
      }
    </div>
  )
})

ConnectWallet.displayName = 'ConnectWallet'


export default ConnectWallet
