import { TokenBalance } from '@txkit/react'

import dedent from '../../helpers/dedent'
import TbMockBalance from './TbMockBalance'
import { InfoGrid, StorySection } from '../../components'


const SAMPLE_ADDRESS = '0xaC8e0D90b7dc16D63ad77d9CDd71e3DAb45ABE51' as const


const USDC_ICON = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'


const ExamplesTab = () => (
  <>
    <p className="story-description">Production recipes for TokenBalance. Each example pairs a use-case hint with a copyable snippet</p>

    <StorySection
      title="Default ETH (native)"
      useWhen="Show the connected wallet's native balance with auto fiat. Zero-config drop-in for headers and dashboards"
      code={dedent`
        import { TokenBalance } from '@txkit/react'

        const HeaderBalance = () => (
          <TokenBalance />
        )
      `}
    >
      <TbMockBalance state="ready" symbol="ETH" amount="1.2345" fiat="$4,321.98" />
    </StorySection>

    <StorySection
      title="ERC-20 (USDC)"
      useWhen="Pass `token={address}` to read any ERC-20 via multicall. Decimals + symbol are auto-fetched from the contract"
      code={dedent`
        import { TokenBalance } from '@txkit/react'

        const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

        const UsdcBalance = () => (
          <TokenBalance token={USDC} />
        )
      `}
    >
      <TbMockBalance state="ready" symbol="USDC" amount="1,000.00" fiat="$1,000.00" />
    </StorySection>

    <StorySection
      title="Row Variant (portfolio)"
      useWhen="List multiple tokens in a portfolio table layout. Icon + name + balance + fiat align as a row"
      code={dedent`
        import { TokenBalance } from '@txkit/react'

        const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
        const USDC_ICON = 'https://.../usdc.png'

        const Portfolio = () => (
          <>
            <TokenBalance variant="row" name="Ether" showIcon />
            <TokenBalance
              variant="row"
              name="USD Coin"
              token={USDC}
              icon={USDC_ICON}
            />
          </>
        )
      `}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 360 }}>
        <TbMockBalance variant="row" name="Ether" symbol="ETH" amount="1.2345" fiat="$4,321.98" />
        <TbMockBalance variant="row" name="USD Coin" symbol="USDC" icon={USDC_ICON} amount="1,000.00" fiat="$1,000.00" />
      </div>
    </StorySection>

    <StorySection
      title="Loading + Error States"
      useWhen="Skeleton on first load, dash placeholder on RPC error. Error path surfaces a retry hook via onError - both states are auto-handled"
      code={dedent`
        import { TokenBalance } from '@txkit/react'

        const SafeBalance = () => (
          <TokenBalance
            onError={(error) => {
              // surface to a toast / inline retry CTA
              console.error('Balance fetch failed', error)
            }}
          />
        )
      `}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 360 }}>
        <TbMockBalance state="loading" />
        <TbMockBalance state="error" />
      </div>
    </StorySection>

    <StorySection
      title="Custom Address (read-only)"
      useWhen="Read another address's balance without a wallet. Useful for explorer pages, profile cards, leaderboards"
      code={dedent`
        import { TokenBalance } from '@txkit/react'

        // any wallet address; no signer required
        const SAMPLE_ADDRESS = '0xaC8e0D90b7dc16D63ad77d9CDd71e3DAb45ABE51'

        const ProfileBalance = () => (
          <TokenBalance address={SAMPLE_ADDRESS} />
        )
      `}
    >
      <TokenBalance address={SAMPLE_ADDRESS} />
    </StorySection>

    <StorySection
      title="Custom Render"
      useWhen="Bring your own UI on top of the data. Component owns fetching, you own layout"
      headless
      code={dedent`
        import { TokenBalance } from '@txkit/react'

        const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

        const FancyBalance = () => (
          <TokenBalance token={USDC}>
            {({ formatted, symbol, fiatFormatted, isLoading }) => {
              if (isLoading) {
                return <span>Loading...</span>
              }

              return (
                <div>
                  <strong>{formatted} {symbol}</strong>
                  {fiatFormatted && <span>{fiatFormatted}</span>}
                </div>
              )
            }}
          </TokenBalance>
        )
      `}
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
      title="useTokenBalance (headless)"
      useWhen="Read balance imperatively in custom logic (gating, conditional rendering, derived values). No UI from txKit"
      headless
      code={dedent`
        import { formatUnits } from 'viem'
        import { useTokenBalance } from '@txkit/react'

        const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

        const PortfolioGuard = ({ children }) => {
          const { balance, decimals, isLoading } = useTokenBalance({ token: USDC })

          if (isLoading) {
            return <span>Loading...</span>
          }

          const human = balance && decimals
            ? Number(formatUnits(balance, decimals))
            : 0

          if (human < 100) {
            return <span>Hold at least 100 USDC to access this section.</span>
          }

          return children
        }
      `}
    >
      <InfoGrid entries={[
        { label: 'Status', value: 'ready' },
        { label: 'Token', value: 'USDC' },
        { label: 'Balance', value: '1000.000000', mono: true },
        { label: 'Decimals', value: 6 },
      ]} />
    </StorySection>

    <StorySection
      title="Block-Based Refresh"
      useWhen="Auto-refetch on every new block via BalanceWatcher context. Updates without polling boilerplate, dedupes across components"
      code={dedent`
        import { useBalanceContext, TokenBalance } from '@txkit/react'

        const BlockTicker = () => {
          const context = useBalanceContext()
          return <span>Last block: {context?.lastBlockNumber?.toString()}</span>
        }

        const Wallet = () => (
          <>
            <BlockTicker />
            <TokenBalance />
          </>
        )
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
  </>
)


export default ExamplesTab
