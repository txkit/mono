import { TxKitProvider, TokenBalance } from '@txkit/react'

import StorySection from '../../StorySection'
import { USDC_ADDRESS, VITALIK_ADDRESS } from '../../config'
import { WalletGate, BlockWatcherDemo, HeadlessBalanceExample } from './helpers'


const ExamplesTab = ({ config }: { config: TxKit.Config }) => (
  <TxKitProvider config={config}>
    <p className="story-description">Code examples and advanced usage patterns</p>
    <StorySection
      title="Default (Native ETH)"
      description="Shows connected wallet's native ETH balance with USD fiat value"
      code={`<TokenBalance />`}
    >
      <WalletGate>
        <TokenBalance />
      </WalletGate>
    </StorySection>

    <StorySection
      title="ERC-20 (USDC)"
      code={`<TokenBalance token="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" />`}
    >
      <WalletGate>
        <TokenBalance token={USDC_ADDRESS} />
      </WalletGate>
    </StorySection>

    <StorySection
      title="Row Variant"
      description="Token list / portfolio layout with icon, name, balance and fiat"
      code={`<TokenBalance variant="row" name="USD Coin" token="0xA0b86991..." />`}
    >
      <WalletGate>
        <div style={{ maxWidth: 360 }}>
          <TokenBalance variant="row" name="Ether" />
          <TokenBalance
            variant="row"
            name="USD Coin"
            token={USDC_ADDRESS}
            icon="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png"
          />
        </div>
      </WalletGate>
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
      code={`<TokenBalance token={USDC}>{(data) => <CustomUI />}</TokenBalance>`}
    >
      <WalletGate>
        <TokenBalance token={USDC_ADDRESS}>
          {({ formatted, symbol, fiatFormatted, isLoading }) => (
            <div className="custom-balance">
              {
                isLoading
                  ? <span>Loading...</span>
                  : (
                    <>
                      <strong className="custom-balance-amount">{formatted} {symbol}</strong>
                      {fiatFormatted && <span className="custom-balance-fiat">{fiatFormatted}</span>}
                    </>
                  )
              }
            </div>
          )}
        </TokenBalance>
      </WalletGate>
    </StorySection>

    <StorySection
      title="Block-Based Refresh"
      description="Balance updates on new blocks via BalanceWatcher context"
      code={`const { lastBlockNumber } = useBalanceContext()`}
    >
      <BlockWatcherDemo />
      <div style={{ marginTop: 8 }}>
        <WalletGate>
          <TokenBalance />
        </WalletGate>
      </div>
    </StorySection>

    <StorySection
      title="Headless Hook (useTokenBalance)"
      description="Headless - your UI, txKit logic. Full data access via useTokenBalance hook"
      headless
      code={`const data = useTokenBalance({ token: USDC })
// data.formatted, data.symbol, data.fiatFormatted, ...`}
    >
      <HeadlessBalanceExample />
    </StorySection>

    <StorySection
      title="Multiple (Dedup Demo)"
      description="Two identical TokenBalance - check Network tab, should be one RPC call"
    >
      <WalletGate>
        <div className="story-row">
          <TokenBalance token={USDC_ADDRESS} />
          <TokenBalance token={USDC_ADDRESS} />
        </div>
      </WalletGate>
    </StorySection>
  </TxKitProvider>
)


export default ExamplesTab
