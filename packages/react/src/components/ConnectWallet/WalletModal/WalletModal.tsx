'use client'
import React, { useRef, useCallback, type MouseEvent } from 'react'
import type { Connector } from 'wagmi'

import Portal from '../../Portal'
import WalletList from '../WalletList'
import useEscapeKey from '../../../hooks/useEscapeKey'
import useFocusTrap from '../../../hooks/useFocusTrap'
import useScrollLock from '../../../hooks/useScrollLock'
import useAriaHidden from '../../../hooks/useAriaHidden'
import type { ConnectWalletLabels } from '../labels'


type WalletModalProps = {
  labels: Required<ConnectWalletLabels>
  connectors: readonly Connector[]
  connectingWallet: string | undefined
  isTimedOut: boolean
  onClose: () => void
  onSelect: (connector: Connector) => void
  onCancelConnect: () => void
}

const WalletModal: React.FC<WalletModalProps> = (props) => {
  const {
    labels,
    connectors,
    isTimedOut,
    connectingWallet,
    onClose,
    onSelect,
    onCancelConnect,
  } = props

  const modalRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useAriaHidden(overlayRef)
  useEscapeKey(onClose)
  useFocusTrap(modalRef, true)
  useScrollLock(true)

  const handleOverlayClick = useCallback((event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }, [ onClose ])

  const showConnectingView = Boolean(connectingWallet)
  const titleText = showConnectingView && connectingWallet ? connectingWallet : labels.selectWallet

  return (
    <Portal>
      <div ref={overlayRef} className="tx-cw-overlay" onClick={handleOverlayClick}>
        <div
          ref={modalRef}
          id="tx-wallet-modal"
          className="tx-cw-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tx-wallet-modal-title"
        >
          <div className="tx-cw-modal-header">
            <div className="tx-cw-modal-heading">
              <h2 id="tx-wallet-modal-title" className="tx-cw-modal-title">
                {titleText}
              </h2>
              {
                !showConnectingView && typeof window !== 'undefined' && (
                  <p className="tx-cw-modal-origin">
                    {labels.connectingTo || 'Connecting to'}{' '}
                    <span className="tx-cw-modal-origin-host">{window.location.host}</span>
                  </p>
                )
              }
            </div>
            <button
              type="button"
              className="tx-cw-modal-close"
              onClick={onClose}
              aria-label={labels.close}
            >
              &times;
            </button>
          </div>

          <WalletList
            connectors={connectors}
            connectingWallet={connectingWallet}
            isTimedOut={isTimedOut}
            onSelect={onSelect}
            onCancelConnect={onCancelConnect}
            labels={labels}
          />
        </div>
      </div>
    </Portal>
  )
}


export default WalletModal
