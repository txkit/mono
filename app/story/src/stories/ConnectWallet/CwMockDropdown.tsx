import React, { useRef, useState, useEffect } from 'react'

import copyIcon from '../../../../../packages/react/src/assets/icons/copy.svg'
import checkIcon from '../../../../../packages/react/src/assets/icons/check.svg'
import logOutIcon from '../../../../../packages/react/src/assets/icons/log-out.svg'
import externalLinkIcon from '../../../../../packages/react/src/assets/icons/external-link.svg'

import { hashGradient } from '../../helpers/hashColor'


const explorerMaskStyle = { maskImage: `url("${externalLinkIcon}")`, WebkitMaskImage: `url("${externalLinkIcon}")` }
const copyMaskStyle = { maskImage: `url("${copyIcon}")`, WebkitMaskImage: `url("${copyIcon}")` }
const checkMaskStyle = { maskImage: `url("${checkIcon}")`, WebkitMaskImage: `url("${checkIcon}")` }
const logOutMaskStyle = { maskImage: `url("${logOutIcon}")`, WebkitMaskImage: `url("${logOutIcon}")` }


type CwMockDropdownProps = {
  wrongChain?: boolean
  labels?: {
    copyAddress?: string
    copied?: string
    disconnect?: string
    switchTo?: string
  }
  onDisconnect?: () => void
  onSwitchChain?: () => void
}

const MOCK_ADDRESS = '0xaC8e0D90b7dc16D63ad77d9CDd71e3DAb45ABE51'

const CwMockDropdown: React.FC<CwMockDropdownProps> = ({ wrongChain = false, labels, onDisconnect, onSwitchChain }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const [ copied, setCopied ] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const firstItem = rootRef.current?.querySelector<HTMLElement>('[role="menuitem"]')
    firstItem?.setAttribute('tabindex', '0')
    firstItem?.focus()
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(MOCK_ADDRESS).catch(() => {})
    setCopied(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div ref={rootRef} className="tx-cw-dropdown">
      {
        wrongChain && (
          <div className="tx-cw-dropdown-mismatch">
            <div className="tx-cw-dropdown-chain-flow">
              <span className="tx-cw-dropdown-chain-dot" style={{ background: 'var(--tx-color-warning)' }} aria-hidden="true" />
              <span>Ethereum</span>
              <span className="tx-cw-dropdown-chain-flow-arrow" aria-hidden="true">→</span>
              <span className="tx-cw-dropdown-chain-target">
                <span className="tx-cw-dropdown-chain-dot" style={{ background: 'var(--tx-color-success)' }} aria-hidden="true" />
                Sepolia
              </span>
            </div>
            <button type="button" className="tx-cw-dropdown-switch-cta" tabIndex={-1} onClick={onSwitchChain}>
              {labels?.switchTo ?? 'Switch to Sepolia'}
            </button>
          </div>
        )
      }
      {
        !wrongChain && (
          <div className="tx-cw-dropdown-header">
            <a
              href="https://etherscan.io/address/0xaC8e0D90b7dc16D63ad77d9CDd71e3DAb45ABE51"
              target="_blank"
              rel="noopener noreferrer"
              className="tx-cw-dropdown-identity-link"
              onClick={(event) => event.preventDefault()}
            >
              <span className="tx-cw-avatar-fallback" style={{ background: hashGradient(MOCK_ADDRESS), width: 40, height: 40, fontSize: 14 }} aria-hidden="true" />
              <div className="tx-cw-dropdown-identity-info">
                <div className="tx-cw-dropdown-name">alice.eth</div>
                <div className="tx-cw-dropdown-chain">
                  <span className="tx-cw-dropdown-chain-dot" style={{ background: 'var(--tx-color-success)' }} aria-hidden="true" />
                  Ethereum
                </div>
              </div>
              <span className="tx-cw-dropdown-explorer-icon" style={explorerMaskStyle} aria-hidden="true" />
            </a>
          </div>
        )
      }

      <div role="menu" aria-label="Account actions (mock)">
        <button
          type="button"
          role="menuitem"
          className="tx-cw-dropdown-item"
          data-copied={copied || undefined}
          tabIndex={-1}
          onClick={handleCopy}
        >
          <span
            className="tx-cw-dropdown-item-icon"
            style={copied ? checkMaskStyle : copyMaskStyle}
            aria-hidden="true"
          />
          <span>{copied ? (labels?.copied ?? 'Copied!') : (labels?.copyAddress ?? 'Copy Address')}</span>
        </button>

        <button type="button" role="menuitem" className="tx-cw-dropdown-item" tabIndex={-1} onClick={onDisconnect}>
          <span className="tx-cw-dropdown-item-icon" style={logOutMaskStyle} aria-hidden="true" />
          {labels?.disconnect ?? 'Disconnect'}
        </button>
      </div>
    </div>
  )
}


export default CwMockDropdown
