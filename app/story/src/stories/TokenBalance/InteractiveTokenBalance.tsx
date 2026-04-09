import { TokenBalance } from '@txkit/react'

import useControls from '../../controls/useControls'
import ControlPanel from '../../controls/ControlPanel'
import { USDC_ADDRESS } from '../../config'
import WalletGate from '../shared/WalletGate'


const InteractiveTokenBalance = () => {
  const { values, entries, reset } = useControls({
    variant: { type: 'select', default: 'inline', options: [ 'inline', 'row' ] },
    showFiat: { type: 'boolean', default: true },
    showIcon: { type: 'boolean', default: true },
    showSymbol: { type: 'boolean', default: true },
    fiatCurrency: { type: 'select', default: 'USD', options: [ 'USD', 'EUR', 'GBP', 'JPY' ] },
    token: { type: 'select', default: 'native', options: [ 'native', 'USDC' ] },
  })

  return (
    <>
      <ControlPanel entries={entries} onReset={reset} />
      <div className="story-card">
        <WalletGate>
          <TokenBalance
            variant={values.variant as 'inline' | 'row'}
            token={values.token === 'USDC' ? USDC_ADDRESS : undefined}
            name={values.token === 'USDC' ? 'USD Coin' : 'Ether'}
            showFiat={values.showFiat}
            showIcon={values.showIcon}
            showSymbol={values.showSymbol}
            fiatCurrency={values.fiatCurrency}
          />
        </WalletGate>
      </div>
    </>
  )
}


export default InteractiveTokenBalance
