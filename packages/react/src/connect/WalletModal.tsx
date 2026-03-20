import React, { useRef, useCallback, type MouseEvent } from 'react'
import type { Connector } from 'wagmi'

import Portal from '../primitives/Portal'
import useEscapeKey from '../hooks/useEscapeKey'
import useFocusTrap from '../hooks/useFocusTrap'
import useScrollLock from '../hooks/useScrollLock'
import type { ConnectWalletLabels } from './labels'


type WalletModalProps = {
  labels: Required<ConnectWalletLabels>
  connectors: readonly Connector[]
  onClose: () => void
  onSelect: (connector: Connector) => void
}

const WalletModal: React.FC<WalletModalProps> = ({ labels, connectors, onClose, onSelect }) => {
  const modalRef = useRef<HTMLDivElement>(null)

  useEscapeKey(onClose)
  useFocusTrap(modalRef, true)
  useScrollLock(true)

  const handleOverlayClick = useCallback((event: MouseEvent) => {
    if (event.target === event.currentTarget) onClose()
  }, [ onClose ])

  const handleSelect = useCallback((connector: Connector) => {
    onSelect(connector)
    onClose()
  }, [ onSelect, onClose ])

  return (
    <Portal>
      <div className="txkit-cw-overlay" onClick={handleOverlayClick}>
        <div
          ref={modalRef}
          id="txkit-wallet-modal"
          className="txkit-cw-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="txkit-wallet-modal-title"
        >
          <div className="txkit-cw-modal-header">
            <h2 id="txkit-wallet-modal-title" className="txkit-cw-modal-title">
              {labels.selectWallet}
            </h2>
            <button
              type="button"
              className="txkit-cw-modal-close"
              onClick={onClose}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          <ul className="txkit-cw-modal-list">
            {
              connectors.map((connector) => (
                <li key={connector.uid}>
                  <button
                    type="button"
                    className="txkit-cw-wallet"
                    onClick={() => handleSelect(connector)}
                    aria-label={`${labels.selectWallet}: ${connector.name}`}
                  >
                    {
                      connector.icon && (
                        <img
                          src={connector.icon}
                          alt=""
                          className="txkit-cw-wallet-icon"
                        />
                      )
                    }
                    {connector.name}
                  </button>
                </li>
              ))
            }
          </ul>
          <a
            href="https://ethereum.org/wallets"
            target="_blank"
            rel="noopener noreferrer"
            className="txkit-cw-modal-help"
          >
            {labels.whatIsWallet}
          </a>
        </div>
      </div>
    </Portal>
  )
}


export default WalletModal
