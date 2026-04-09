import React from 'react'
import { useAccount } from 'wagmi'
import { ConnectWallet } from '@txkit/react'


const WalletGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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


export default WalletGate
