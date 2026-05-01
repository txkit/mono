import { useMemo } from 'react'
import { TokenBalance, useTokenBalance } from '@txkit/react'

import { USDC_ADDRESS } from '../../config'
import generateCode from '../../helpers/generateCode'
import { ICON_SOURCE_DEFAULT, isIconSourceValue, resolveTokenIconUrl } from '../../helpers/iconSources'
import type { ControlEntry } from '../../components/ControlPanel/useControls'
import { WalletGate, useControls, ControlPanel, CodeBlock, StateDisplay } from '../../components'
import { TB_STATES } from './states'


const refetchMap: Record<string, number | undefined> = {
  off: undefined,
  '5s': 5000,
  '15s': 15000,
  '60s': 60000,
}

type Props = { tokenAddress?: `0x${string}` }

type BalanceState = 'error' | 'loading' | 'ready'

type DeriveBalanceStateInput = {
  isError: boolean
  isLoading: boolean
}

const deriveBalanceState = (input: DeriveBalanceStateInput): BalanceState => {
  const errorBranch: BalanceState | null = input.isError ? 'error' : null
  const loadingBranch: BalanceState | null = input.isLoading ? 'loading' : null
  return errorBranch ?? loadingBranch ?? 'ready'
}

const BalanceStateVisualizer = ({ tokenAddress }: Props) => {
  const { isLoading, isError } = useTokenBalance({ token: tokenAddress })
  const state = deriveBalanceState({ isError, isLoading })
  return <StateDisplay states={TB_STATES} currentState={state} />
}

const InteractiveTokenBalance = () => {
  const { values, entries, isDefault, reset } = useControls({
    variant: { type: 'select', default: 'inline', options: [ 'inline', 'row' ] },
    token: { type: 'select', default: 'native', options: [ 'native', 'USDC' ] },
    fiatCurrency: { type: 'select', default: 'USD', options: [ 'USD', 'EUR', 'GBP', 'JPY' ] },
    refetchInterval: { type: 'select', default: 'off', options: [ 'off', '5s', '15s', '60s' ] },
    icon: { type: 'icon-source', default: ICON_SOURCE_DEFAULT, tokenAddress: '', tokenSymbol: 'ETH' },
    showFiat: { type: 'boolean', default: true },
    showIcon: { type: 'boolean', default: true },
    showSymbol: { type: 'boolean', default: true },
  })

  const tokenAddress = values.token === 'USDC' ? USDC_ADDRESS : undefined
  const tokenAddressForIcon = tokenAddress ?? ''
  const tokenSymbol = values.token === 'USDC' ? 'USDC' : 'ETH'
  const iconOverride = isIconSourceValue(values.icon) ? resolveTokenIconUrl(tokenAddressForIcon, values.icon) : undefined

  const decoratedEntries: ControlEntry[] = entries.map((entry) => {
    if (entry.def.type !== 'icon-source') {
      return entry
    }
    return { ...entry, def: { ...entry.def, tokenAddress: tokenAddressForIcon, tokenSymbol } }
  })

  const code = useMemo(() => generateCode('TokenBalance', entries, {
    importLine: "import { TokenBalance } from '@txkit/react'",
    formatProp: {
      token: (value) => value === 'USDC' ? `"${USDC_ADDRESS}"` : null,
      refetchInterval: (value) => value === 'off' ? null : `{${refetchMap[value as string]}}`,
      icon: (value) => {
        if (!isIconSourceValue(value)) {
          return null
        }
        const resolved = resolveTokenIconUrl(tokenAddressForIcon, value)
        return resolved === undefined ? null : `"${resolved}"`
      },
    },
  }), [ entries, tokenAddressForIcon ])

  return (
    <div className="story-live-layout">
      <div className="story-live-left">
        <WalletGate>
          <BalanceStateVisualizer tokenAddress={tokenAddress} />
        </WalletGate>
        <div className="story-live-preview-card">
          <div className="story-live-preview-inner">
            <WalletGate>
              <TokenBalance
                variant={values.variant as 'inline' | 'row'}
                token={tokenAddress}
                name={values.token === 'USDC' ? 'USD Coin' : 'Ether'}
                icon={iconOverride}
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
        <ControlPanel entries={decoratedEntries} isDefault={isDefault} onReset={reset} />
      </div>
    </div>
  )
}


export default InteractiveTokenBalance
