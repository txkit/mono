import React from 'react'
import { useBalance } from 'wagmi'
import { sepolia } from 'viem/chains'
import { formatEther } from 'viem'

import { MIN_BALANCE_WEI } from './sepoliaFlows'

import { FaucetCard } from '../../components'


type FaucetWarningProps = {
  address: `0x${string}` | undefined
  requiredEth?: bigint
}

const FaucetWarning: React.FC<FaucetWarningProps> = ({ address, requiredEth = MIN_BALANCE_WEI }) => {
  const { data, isLoading } = useBalance({ address, chainId: sepolia.id })

  if (!address || isLoading) {
    return null
  }

  const balance = data?.value ?? 0n
  const hasEnough = balance >= requiredEth
  if (hasEnough) {
    return null
  }

  return (
    <FaucetCard
      mode="alert"
      extraInfo={(
        <>
          Your Sepolia balance is <code>{formatEther(balance)} ETH</code>. Multi-step flows recommend at least <code>{formatEther(requiredEth)} ETH</code> for the deposit + gas.
        </>
      )}
    />
  )
}


export default FaucetWarning
