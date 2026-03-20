import React, { useRef, useState, useCallback } from 'react'
import type { Chain } from 'viem'
import { getExplorerUrl } from '@txkit/core'

import useClickOutside from '../hooks/useClickOutside'
import useEscapeKey from '../hooks/useEscapeKey'
import type { ConnectWalletLabels } from './labels'


/** Deterministic color from string hash */
const hashColor = (str: string): string => {
  let hash = 0
  for (let index = 0; index < str.length; index++) {
    hash = str.charCodeAt(index) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 55%, 45%)`
}

type AccountDropdownProps = {
  address: string
  ensName?: string | null
  ensAvatar?: string | null
  formattedBalance?: string
  chain?: Chain
  labels: Required<ConnectWalletLabels>
  onClose: () => void
  onDisconnect: () => void
}

const AccountDropdown: React.FC<AccountDropdownProps> = ({
  address,
  ensName,
  ensAvatar,
  formattedBalance,
  chain,
  labels,
  onClose,
  onDisconnect,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [ copied, setCopied ] = useState(false)

  useClickOutside(dropdownRef, onClose)
  useEscapeKey(onClose)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [ address ])

  const handleDisconnect = useCallback(() => {
    onDisconnect()
    onClose()
  }, [ onDisconnect, onClose ])

  const explorerUrl = chain?.id ? getExplorerUrl(chain.id, address, 'address') : undefined
  const displayName = ensName || `${address.slice(0, 6)}...${address.slice(-4)}`

  return (
    <div ref={dropdownRef} id="txkit-account-dropdown" className="txkit-cw-dropdown">
      <div className="txkit-cw-dropdown-header">
        <div className="txkit-cw-dropdown-identity">
          {
            ensAvatar
              ? <img src={ensAvatar} alt="" className="txkit-cw-avatar" />
              : (
                <span
                  className="txkit-cw-avatar-fallback"
                  style={{ backgroundColor: hashColor(address) }}
                >
                  {address.slice(2, 4).toUpperCase()}
                </span>
              )
          }
          <div className="txkit-cw-dropdown-identity-info">
            <div className="txkit-cw-dropdown-name">{displayName}</div>
            {
              chain && (
                <div className="txkit-cw-dropdown-chain">{chain.name}</div>
              )
            }
          </div>
        </div>
        {
          formattedBalance && (
            <div className="txkit-cw-dropdown-balance">{formattedBalance}</div>
          )
        }
      </div>
      <button
        type="button"
        className="txkit-cw-dropdown-item"
        data-copied={copied || undefined}
        onClick={handleCopy}
      >
        {copied ? labels.copied : labels.copyAddress}
      </button>
      {
        explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="txkit-cw-dropdown-item"
          >
            {labels.explorer}
          </a>
        )
      }
      <button
        type="button"
        className="txkit-cw-dropdown-item"
        data-variant="danger"
        onClick={handleDisconnect}
      >
        {labels.disconnect}
      </button>
    </div>
  )
}


export default AccountDropdown
