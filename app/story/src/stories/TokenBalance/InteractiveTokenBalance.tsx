import { useMemo } from 'react'
import { TokenBalance } from '@txkit/react'

import { USDC_ADDRESS } from '../../config'
import generateCode from '../../helpers/generateCode'
import { WalletGate, useControls, ControlPanel, CodeBlock } from '../../components'


const refetchMap: Record<string, number | undefined> = {
  off: undefined,
  '5s': 5000,
  '15s': 15000,
  '60s': 60000,
}

const InteractiveTokenBalance = () => {
  const { values, entries, isDefault, reset } = useControls({
    variant: { type: 'select', default: 'inline', options: [ 'inline', 'row' ] },
    token: { type: 'select', default: 'native', options: [ 'native', 'USDC' ] },
    fiatCurrency: { type: 'select', default: 'USD', options: [ 'USD', 'EUR', 'GBP', 'JPY' ] },
    refetchInterval: { type: 'select', default: 'off', options: [ 'off', '5s', '15s', '60s' ] },
    icon: { type: 'string', default: '' },
    price: { type: 'number', default: 0, min: 0, step: 0.01 },
    showFiat: { type: 'boolean', default: true },
    showIcon: { type: 'boolean', default: true },
    showSymbol: { type: 'boolean', default: true },
  })

  const priceOverride = values.price > 0 ? values.price : undefined
  const iconOverride = values.icon.trim() !== '' ? values.icon : undefined

  const code = useMemo(() => generateCode('TokenBalance', entries, {
    importLine: "import { TokenBalance } from '@txkit/react'",
    exclude: [ 'icon', 'price' ],
    formatProp: {
      token: (value) => value === 'USDC' ? `"${USDC_ADDRESS}"` : null,
      refetchInterval: (value) => value === 'off' ? null : `{${refetchMap[value as string]}}`,
    },
  }), [ entries ])

  return (
    <div className="story-live-layout">
      <div className="story-live-left">
        <div className="story-live-preview-card">
          <div className="story-live-preview-inner">
            <WalletGate>
              <TokenBalance
                variant={values.variant as 'inline' | 'row'}
                token={values.token === 'USDC' ? USDC_ADDRESS : undefined}
                name={values.token === 'USDC' ? 'USD Coin' : 'Ether'}
                icon={iconOverride}
                price={priceOverride}
                refetchInterval={refetchMap[values.refetchInterval]}
                showFiat={values.showFiat}
                showIcon={values.showIcon}
                showSymbol={values.showSymbol}
                fiatCurrency={values.fiatCurrency}
              />
            </WalletGate>
          </div>
        </div>
        <CodeBlock code={code} />
      </div>
      <div className="story-live-right">
        <ControlPanel entries={entries} isDefault={isDefault} onReset={reset} />
      </div>
    </div>
  )
}


export default InteractiveTokenBalance
