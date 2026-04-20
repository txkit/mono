import { TokenBalance } from '@txkit/react'

import dedent from '../../helpers/dedent'
import TbMockBalance from './TbMockBalance'
import { VITALIK_ADDRESS } from '../../config'
import { InfoGrid, StorySection } from '../../components'


const USDC_ICON = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'


const ExamplesTab = () => (
  <>
    <p className="story-description">Code examples and advanced usage patterns - mocks show final UI without a wallet</p>

    <StorySection
      title="Default (Native ETH)"
      description="Shows connected wallet's native ETH balance with USD fiat value"
      code={`<TokenBalance />`}
    >
      <TbMockBalance state="ready" symbol="ETH" amount="1.2345" fiat="$4,321.98" />
    </StorySection>

    <StorySection
      title="ERC-20 (USDC)"
      code={`<TokenBalance token="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" />`}
    >
      <TbMockBalance state="ready" symbol="USDC" amount="1,000.00" fiat="$1,000.00" />
    </StorySection>

    <StorySection
      title="Row Variant"
      description="Token list / portfolio layout with icon, name, balance and fiat"
      code={dedent`
        <TokenBalance variant="row" name="Ether" showIcon />
        <TokenBalance variant="row" name="USD Coin" token={USDC} icon={USDC_ICON} />
      `}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 360 }}>
        <TbMockBalance variant="row" name="Ether" symbol="ETH" amount="1.2345" fiat="$4,321.98" />
        <TbMockBalance variant="row" name="USD Coin" symbol="USDC" icon={USDC_ICON} amount="1,000.00" fiat="$1,000.00" />
      </div>
    </StorySection>

    <StorySection
      title="Loading State"
      description="Skeleton pulse while balance is being fetched"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 360 }}>
        <TbMockBalance state="loading" />
        <TbMockBalance state="loading" variant="row" name="USD Coin" symbol="USDC" />
      </div>
    </StorySection>

    <StorySection
      title="Zero Balance"
      description="Dimmed when balance is exactly zero"
    >
      <TbMockBalance state="zero" symbol="ETH" />
    </StorySection>

    <StorySection
      title="Error State"
      description="Surfaces RPC / fetch errors with a retry affordance"
    >
      <TbMockBalance state="error" />
    </StorySection>

    <StorySection
      title="Hide Fiat"
      code={`<TokenBalance showFiat={false} />`}
    >
      <TbMockBalance state="ready" symbol="ETH" amount="1.2345" showFiat={false} />
    </StorySection>

    <StorySection
      title="Hide Symbol"
      code={`<TokenBalance showSymbol={false} />`}
    >
      <TbMockBalance state="ready" amount="1.2345" showSymbol={false} />
    </StorySection>

    <StorySection
      title="EUR Currency"
      code={`<TokenBalance fiatCurrency="EUR" />`}
    >
      <TbMockBalance state="ready" symbol="ETH" amount="1.2345" fiat="EUR 3,987.40" />
    </StorySection>

    <StorySection
      title="Custom Address (vitalik.eth)"
      description="Fetches balance for a specific address - no wallet needed"
      code={`<TokenBalance address="0xd8dA6BF..." />`}
    >
      <TokenBalance address={VITALIK_ADDRESS} />
    </StorySection>

    <StorySection
      title="Custom Render (children-as-function)"
      description="Headless - your UI, txKit logic. Same render function, two states"
      code={dedent`
        <TokenBalance token={USDC}>
          {({ formatted, symbol, fiatFormatted, isLoading }) => (
            isLoading
              ? <span>Loading...</span>
              : (
                <>
                  <strong>{formatted} {symbol}</strong>
                  {fiatFormatted && <span>{fiatFormatted}</span>}
                </>
              )
          )}
        </TokenBalance>
      `}
      headless
    >
      <div className="story-row">
        <div className="custom-balance">
          <span>Loading...</span>
        </div>
        <div className="custom-balance">
          <strong className="custom-balance-amount">1,000.00 USDC</strong>
          <span className="custom-balance-fiat">$1,000.00</span>
        </div>
      </div>
    </StorySection>

    <StorySection
      title="Block-Based Refresh"
      description="Balance updates on every new block via BalanceWatcher context - invalidates cache in one place"
      code={dedent`
        const { lastBlockNumber } = useBalanceContext()
        // TokenBalance auto-subscribes, no polling setup needed
      `}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <InfoGrid entries={[
          { label: 'Last Block', value: '21,123,456', mono: true },
          { label: 'Status', value: 'Block watcher active' },
        ]} />
        <TbMockBalance state="ready" symbol="ETH" amount="1.2345" fiat="$4,321.98" />
      </div>
    </StorySection>

    <StorySection
      title="Headless Hook (useTokenBalance)"
      description="Headless - your UI, txKit logic. Full data access via useTokenBalance hook"
      headless
      code={dedent`
        const data = useTokenBalance({ token: USDC })
        // data.balance (bigint), data.decimals, data.symbol, data.isLoading, ...
      `}
    >
      <InfoGrid entries={[
        { label: 'Status', value: 'ready' },
        { label: 'Token', value: 'USDC' },
        { label: 'Balance', value: '1000.000000', mono: true },
        { label: 'Decimals', value: 6 },
      ]} />
    </StorySection>
  </>
)


export default ExamplesTab
