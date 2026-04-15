import { useTokenBalance } from '@txkit/react'

import { InfoGrid } from '../../components'
import { USDC_ADDRESS } from '../../config'


const HeadlessBalanceExample = () => {
  const data = useTokenBalance({ token: USDC_ADDRESS })

  return (
    <InfoGrid entries={[
      { label: 'Status', value: data.isLoading ? 'loading' : data.isError ? 'error' : 'ready' },
      { label: 'Token', value: data.symbol },
      { label: 'Balance', value: data.formatted },
      { label: 'Fiat', value: data.fiatFormatted },
      { label: 'Decimals', value: data.decimals },
    ]} />
  )
}


export default HeadlessBalanceExample
