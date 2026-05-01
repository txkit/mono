import React from 'react'

import { ExternalLinkIcon, InfoIcon, AlertTriangleIcon } from '../Icons/icons'

import './FaucetCard.css'


type FaucetEntry = {
  name: string
  url: string
  note: string
}

type FaucetCardProps = {
  className?: string
  mode?: 'note' | 'alert'
  extraInfo?: React.ReactNode
}

const FAUCETS: ReadonlyArray<FaucetEntry> = [
  { name: 'Google Cloud', url: 'https://cloud.google.com/application/web3/faucet/ethereum/sepolia', note: 'Google account, no PoW' },
  { name: 'Alchemy', url: 'https://www.alchemy.com/faucets/ethereum-sepolia', note: 'Free signup' },
  { name: 'QuickNode', url: 'https://faucet.quicknode.com/ethereum/sepolia', note: 'Twitter login' },
]

const FaucetCard: React.FC<FaucetCardProps> = (props) => {
  const {
    className,
    mode = 'note',
    extraInfo,
  } = props

  const isAlert = mode === 'alert'
  const heading = isAlert ? 'Insufficient Sepolia ETH' : 'Need Sepolia ETH?'

  const rootClass = [
    'faucet-card',
    isAlert ? 'faucet-card-alert' : 'faucet-card-note',
    className ?? '',
  ].filter(Boolean).join(' ')

  return (
    <div className={rootClass} role={isAlert ? 'alert' : undefined}>
      <div className="faucet-card-header">
        {
          isAlert
            ? <AlertTriangleIcon className="faucet-card-header-icon" />
            : <InfoIcon className="faucet-card-header-icon" />
        }
        <div className="faucet-card-header-text">
          <strong className="faucet-card-title">{heading}</strong>
          {
            extraInfo && (
              <p className="faucet-card-extra">{extraInfo}</p>
            )
          }
          <p className="faucet-card-subtitle">Get testnet ETH from these faucets:</p>
        </div>
      </div>
      <ul className="faucet-card-list">
        {
          FAUCETS.map((faucet) => (
            <li key={faucet.url} className="faucet-card-row">
              <a
                href={faucet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="faucet-card-row-link"
              >
                {faucet.name}
                <ExternalLinkIcon size={12} />
              </a>
              <span className="faucet-card-row-sep" aria-hidden="true">·</span>
              <span className="faucet-card-row-note">{faucet.note}</span>
            </li>
          ))
        }
      </ul>
    </div>
  )
}


export default FaucetCard
