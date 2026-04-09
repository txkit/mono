import React from 'react'
import { useAccount } from 'wagmi'
import { ConnectWallet, useTokenBalance, useBalanceContext } from '@txkit/react'

import { USDC_ADDRESS } from '../../config'


export const WalletGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected } = useAccount()

  if (!isConnected) {
    return (
      <div className="story-empty">
        <ConnectWallet label="Connect to view" />
      </div>
    )
  }

  return <>{children}</>
}

export const BlockWatcherDemo = () => {
  const context = useBalanceContext()

  return (
    <div className="story-info-grid">
      <span className="story-info-key">Last Block</span>
      <span className="story-info-value">{context?.lastBlockNumber?.toString() ?? 'waiting...'}</span>
      <span className="story-info-key">Status</span>
      <span className="story-info-value">
        {context ? 'Block watcher active' : 'No BalanceContext'}
      </span>
    </div>
  )
}

export const HeadlessBalanceExample = () => {
  const data = useTokenBalance({ token: USDC_ADDRESS })

  return (
    <div className="story-info-grid">
      <span className="story-info-key">Status</span>
      <span className="story-info-value">{data.isLoading ? 'loading' : data.isError ? 'error' : 'ready'}</span>
      <span className="story-info-key">Token</span>
      <span className="story-info-value">{data.symbol ?? '-'}</span>
      <span className="story-info-key">Balance</span>
      <span className="story-info-value">{data.formatted ?? '-'}</span>
      <span className="story-info-key">Fiat</span>
      <span className="story-info-value">{data.fiatFormatted ?? '-'}</span>
      <span className="story-info-key">Decimals</span>
      <span className="story-info-value">{data.decimals ?? '-'}</span>
    </div>
  )
}
