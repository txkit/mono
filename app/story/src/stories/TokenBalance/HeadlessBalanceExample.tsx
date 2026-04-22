import { formatUnits } from 'viem'
import { useTokenBalance } from '@txkit/react'

import { InfoGrid } from '../../components'
import { USDC_ADDRESS } from '../../config'


const HeadlessBalanceExample = () => {
  const data = useTokenBalance({ token: USDC_ADDRESS })

  const formatted = data.balance !== undefined && data.decimals !== undefined
    ? formatUnits(data.balance, data.decimals)
    : undefined

  let status: 'loading' | 'error' | 'ready' = 'ready'
  if (data.isLoading) {
    status = 'loading'
  }
  else if (data.isError) {
    status = 'error'
  }

  return (
    <InfoGrid entries={[
      { label: 'Status', value: status },
      { label: 'Token', value: data.symbol },
      { label: 'Balance', value: formatted, mono: true },
      { label: 'Decimals', value: data.decimals },
    ]} />
  )
}


export default HeadlessBalanceExample
