import { formatUnits } from 'viem'
import { useTokenBalance } from '@txkit/react'

import { InfoGrid } from '../../components'
import { USDC_ADDRESS } from '../../config'


const HeadlessBalanceExample = () => {
  const data = useTokenBalance({ token: USDC_ADDRESS })

  const formatted = data.balance !== undefined && data.decimals !== undefined
    ? formatUnits(data.balance, data.decimals)
    : undefined

  return (
    <InfoGrid entries={[
      { label: 'Status', value: data.isLoading ? 'loading' : data.isError ? 'error' : 'ready' },
      { label: 'Token', value: data.symbol },
      { label: 'Balance', value: formatted, mono: true },
      { label: 'Decimals', value: data.decimals },
    ]} />
  )
}


export default HeadlessBalanceExample
