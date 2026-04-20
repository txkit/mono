import React, { useRef, useState } from 'react'

import { hashGradient } from '../../helpers/hashColor'


type CwMockDropdownProps = {
  wrongChain?: boolean
}

const MOCK_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

const CwMockDropdown: React.FC<CwMockDropdownProps> = ({ wrongChain = false }) => {
  const [ copied, setCopied ] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleCopy = () => {
    navigator.clipboard.writeText(MOCK_ADDRESS).catch(() => {})
    setCopied(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="txkit-cw-dropdown">
      {
        wrongChain && (
          <div className="txkit-cw-dropdown-mismatch">
            <div className="txkit-cw-dropdown-chain-flow">
              <span className="txkit-cw-dropdown-chain-dot" style={{ background: 'var(--txkit-color-warning)' }} aria-hidden="true" />
              <span>Ethereum</span>
              <span className="txkit-cw-dropdown-chain-flow-arrow" aria-hidden="true">→</span>
              <span className="txkit-cw-dropdown-chain-target">
                <span className="txkit-cw-dropdown-chain-dot" style={{ background: 'var(--txkit-color-success)' }} aria-hidden="true" />
                Sepolia
              </span>
            </div>
            <button type="button" className="txkit-cw-dropdown-switch-cta" tabIndex={-1}>
              Switch to Sepolia
            </button>
          </div>
        )
      }
      {
        !wrongChain && (
          <div className="txkit-cw-dropdown-header">
            <a
              href="https://etherscan.io/address/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
              target="_blank"
              rel="noopener noreferrer"
              className="txkit-cw-dropdown-identity-link"
              onClick={(event) => event.preventDefault()}
            >
              <span className="txkit-cw-avatar-fallback" style={{ background: hashGradient(MOCK_ADDRESS), width: 40, height: 40, fontSize: 14 }} aria-hidden="true" />
              <div className="txkit-cw-dropdown-identity-info">
                <div className="txkit-cw-dropdown-name">vitalik.eth</div>
                <div className="txkit-cw-dropdown-chain">
                  <span className="txkit-cw-dropdown-chain-dot" style={{ background: 'var(--txkit-color-success)' }} aria-hidden="true" />
                  Ethereum
                </div>
              </div>
              <svg className="txkit-cw-dropdown-explorer-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 3h6v6" />
                <path d="M10 14 21 3" />
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              </svg>
            </a>
          </div>
        )
      }

      <div role="menu" aria-label="Account actions (mock)">
        <button
          type="button"
          role="menuitem"
          className="txkit-cw-dropdown-item"
          data-copied={copied || undefined}
          tabIndex={-1}
          onClick={handleCopy}
        >
          {
            copied
              ? (
                <svg className="txkit-cw-dropdown-item-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )
              : (
                <svg className="txkit-cw-dropdown-item-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )
          }
          <span>{copied ? 'Copied!' : 'Copy Address'}</span>
        </button>

        <button type="button" role="menuitem" className="txkit-cw-dropdown-item" tabIndex={-1}>
          <svg className="txkit-cw-dropdown-item-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Disconnect
        </button>
      </div>
    </div>
  )
}


export default CwMockDropdown
