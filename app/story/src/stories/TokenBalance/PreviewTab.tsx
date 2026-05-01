import { useMemo } from 'react'
import { useControls, ControlPanel, StatePanel, CodeBlock, useTxkitThemeClass } from '../../components'
import { ICON_SOURCE_DEFAULT, resolveTokenIconUrl } from '../../helpers/iconSources'
import type { ControlEntry } from '../../components/ControlPanel/useControls'
import type { IconSourceValue } from '../../helpers/iconSources'
import { USDC_ADDRESS } from '../../config'
import TbMockBalance from './TbMockBalance'
import { TB_STATES } from './states'

type MockState = 'loading' | 'ready' | 'error'

type FiatCurrency = 'USD' | 'EUR' | 'GBP' | 'JPY'

const refetchMap: Record<string, number | undefined> = {
  off: undefined,
  '5s': 5000,
  '15s': 15000,
  '60s': 60000,
}

const fxFactor: Record<FiatCurrency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.80,
  JPY: 152,
}

const formatFiat = (parsed: number, tokenSymbol: string, currency: FiatCurrency): string => {
  const usdPerToken = tokenSymbol === 'USDC' ? 1 : 3500
  const value = parsed * usdPerToken * fxFactor[currency]
  const maxDigits = currency === 'JPY' ? 0 : 2

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: maxDigits,
    minimumFractionDigits: maxDigits,
  }).format(value)
}

const PreviewTab = () => {
  const txkitThemeClass = useTxkitThemeClass()
  const schema = useMemo(() => ({
    state: { type: 'state' as const, default: 'ready', states: TB_STATES },
    variant: { type: 'select' as const, default: 'inline', options: [ 'inline', 'row' ] },
    token: { type: 'select' as const, default: 'native', options: [ 'native', 'USDC' ] },
    fiatCurrency: { type: 'select' as const, default: 'USD', options: [ 'USD', 'EUR', 'GBP', 'JPY' ] },
    refetchInterval: { type: 'select' as const, default: 'off', options: [ 'off', '5s', '15s', '60s' ] },
    icon: { type: 'icon-source' as const, default: ICON_SOURCE_DEFAULT, tokenAddress: '', tokenSymbol: 'ETH' },
    amount: { type: 'number' as const, default: 1.2345, min: 0, max: 10, step: 0.0001 },
    showFiat: { type: 'boolean' as const, default: true },
    showIcon: { type: 'boolean' as const, default: true },
    showSymbol: { type: 'boolean' as const, default: true },
  }), [])

  const { values, entries, isDefault, reset } = useControls(schema)
  const activeState = String(values.state ?? 'ready') as MockState
  const stateEntry = entries.find((entry) => entry.def.type === 'state')
  const isRow = values.variant === 'row'
  const tokenChoice = values.token === 'USDC' ? 'USDC' : 'native'
  const tokenName = tokenChoice === 'USDC' ? 'USD Coin' : 'Ether'
  const tokenSymbol = tokenChoice === 'USDC' ? 'USDC' : 'ETH'
  const tokenAddress = tokenChoice === 'USDC' ? USDC_ADDRESS : ''
  const fiatCurrency = (values.fiatCurrency ?? 'USD') as FiatCurrency
  const iconValue = values.icon as IconSourceValue
  const iconUrl = resolveTokenIconUrl(tokenAddress, iconValue) ?? ''
  const rawAmount = Number(values.amount ?? 0)
  const safeAmount = Number.isFinite(rawAmount) ? Math.max(0, rawAmount) : 0
  const amountString = safeAmount.toFixed(4)
  const fiatString = formatFiat(safeAmount, tokenSymbol, fiatCurrency)

  const decoratedEntries: ControlEntry[] = entries.map((entry) => {
    if (entry.def.type !== 'icon-source') {
      return entry
    }
    return { ...entry, def: { ...entry.def, tokenAddress, tokenSymbol } }
  })

  const dimmedKeys = activeState === 'ready' ? [ 'refetchInterval' ] : [ 'refetchInterval', 'amount', 'token', 'fiatCurrency', 'icon' ]

  const previewSnippet = useMemo(() => {
    const props: string[] = []
    if (isRow) {
      props.push('variant="row"')
    }
    if (tokenChoice === 'USDC') {
      props.push('token="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"')
    }
    if (fiatCurrency !== 'USD') {
      props.push(`fiatCurrency="${fiatCurrency}"`)
    }
    if (values.refetchInterval !== 'off') {
      props.push(`refetchInterval={${refetchMap[String(values.refetchInterval)]}}`)
    }
    if (iconUrl !== '') {
      props.push(`icon="${iconUrl}"`)
    }
    if (values.showFiat === false) {
      props.push('showFiat={false}')
    }
    if (values.showIcon === false) {
      props.push('showIcon={false}')
    }
    if (values.showSymbol === false) {
      props.push('showSymbol={false}')
    }
    const lines: string[] = [
      "import { TokenBalance } from '@txkit/react'",
      '',
      'const MyComponent: React.FC = () => (',
    ]
    if (props.length === 0) {
      lines.push('  <TokenBalance />')
    }
    else {
      lines.push('  <TokenBalance')
      props.forEach((prop) => lines.push(`    ${prop}`))
      lines.push('  />')
    }
    lines.push(')')
    return lines.join('\n')
  }, [ isRow, tokenChoice, fiatCurrency, iconUrl, values.refetchInterval, values.showFiat, values.showIcon, values.showSymbol ])

  return (
    <>
      <p className="story-description">Click a state to see how TokenBalance renders - no wallet needed</p>
      <div className="story-live-layout">
        <div className="story-live-left">
          <StatePanel entry={stateEntry} />
          <div className="story-live-preview-card">
            <div className={`tx-root ${txkitThemeClass} story-live-preview-inner`}>
              <TbMockBalance
                state={activeState}
                variant={isRow ? 'row' : 'inline'}
                icon={iconUrl === '' ? undefined : iconUrl}
                name={tokenName}
                symbol={tokenSymbol}
                amount={amountString}
                fiat={fiatString}
                showFiat={Boolean(values.showFiat ?? true)}
                showIcon={Boolean(values.showIcon ?? true)}
                showSymbol={Boolean(values.showSymbol ?? true)}
                onRetry={() => stateEntry?.setValue('ready')}
              />
            </div>
          </div>
          <CodeBlock code={previewSnippet} />
        </div>
        <div className="story-live-right">
          <ControlPanel entries={decoratedEntries} dimmedKeys={dimmedKeys} isDefault={isDefault} onReset={reset} />
        </div>
      </div>
    </>
  )
}


export default PreviewTab
