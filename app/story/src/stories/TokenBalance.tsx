import React from 'react'
import { useAccount } from 'wagmi'
import { TxKitProvider, TokenBalance, ConnectWallet, useTokenBalance, useBalanceContext } from '@txkit/react'

import StorySection from '../StorySection'
import useControls from '../controls/useControls'
import ControlPanel from '../controls/ControlPanel'
import { usePlayground } from '../PlaygroundContext'
import { USDC_ADDRESS, VITALIK_ADDRESS, mainnetOnlyConfig, useStoryConfig } from '../config'


const WalletGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected } = useAccount()

  if (!isConnected) {
    return (
      <div className="story-empty">
        <ConnectWallet label="Connect to view" />
      </div>
    )
  }

  return <>{children}</>
}

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

const BlockWatcherDemo = () => {
  const context = useBalanceContext()

  return (
    <div className="story-info-grid">
      <span className="story-info-key">Last Block</span>
      <span className="story-info-value">{context?.lastBlockNumber?.toString() ?? 'waiting...'}</span>
      <span className="story-info-key">Status</span>
      <span className="story-info-value">
        {context ? 'Block watcher active' : 'No BalanceContext'}
      </span>
    </div>
  )
}

const HeadlessBalanceExample = () => {
  const data = useTokenBalance({ token: USDC_ADDRESS })

  return (
    <div className="story-info-grid">
      <span className="story-info-key">Status</span>
      <span className="story-info-value">{data.isLoading ? 'loading' : data.isError ? 'error' : 'ready'}</span>
      <span className="story-info-key">Token</span>
      <span className="story-info-value">{data.symbol ?? '-'}</span>
      <span className="story-info-key">Balance</span>
      <span className="story-info-value">{data.formatted ?? '-'}</span>
      <span className="story-info-key">Fiat</span>
      <span className="story-info-value">{data.fiatFormatted ?? '-'}</span>
      <span className="story-info-key">Decimals</span>
      <span className="story-info-value">{data.decimals ?? '-'}</span>
    </div>
  )
}


const TokenBalanceStory = () => {
  const { theme, variant } = usePlayground()
  const config = useStoryConfig(mainnetOnlyConfig, theme, variant)

  return (
    <TxKitProvider config={config}>
      <div>
        <div className="story-section">
          <h3>Interactive</h3>
          <p className="story-description">Toggle props to see changes live</p>
          <InteractiveTokenBalance />
        </div>

        <StorySection
          title="Shimmer Loading (Inline)"
          description="Shimmer gradient sweep animation while fetching balance data"
        >
          <div
            className="txkit-root txkit-dark"
            style={{ display: 'inline-block' }}
          >
            <span className="txkit-tb" data-state="loading">
              <span className="txkit-tb-icon-wrap">
                <span className="txkit-tb-icon-fallback" style={{ backgroundColor: '#888' }}>&nbsp;</span>
              </span>
              <span className="txkit-tb-amount">Loading...</span>
              <span className="txkit-tb-fiat">$0.00</span>
            </span>
          </div>
        </StorySection>

        <StorySection
          title="Shimmer Loading (Row)"
          description="Row variant skeleton with name and values placeholders"
        >
          <div
            className="txkit-root txkit-dark"
            style={{ display: 'block', maxWidth: 320 }}
          >
            <span className="txkit-tb txkit-tb-row" data-state="loading">
              <span className="txkit-tb-icon-wrap">
                <span className="txkit-tb-icon-fallback" style={{ backgroundColor: '#888' }}>&nbsp;</span>
              </span>
              <span className="txkit-tb-info">
                <span className="txkit-tb-name">Token Name</span>
                <span className="txkit-tb-symbol">SYM</span>
              </span>
              <span className="txkit-tb-values">
                <span className="txkit-tb-amount">0.0000</span>
                <span className="txkit-tb-fiat">$0.00</span>
              </span>
            </span>
          </div>
        </StorySection>

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
          code={`<TokenBalance
  variant="row"
  name="USD Coin"
  token="0xA0b86991..."
/>`}
        >
          <WalletGate>
            <div style={{ maxWidth: 360 }}>
              <TokenBalance
                variant="row"
                name="Ether"
              />
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
          title="With Icon"
          code={`<TokenBalance
  token="0xA0b86991..."
  icon="https://...logo.png"
/>`}
        >
          <WalletGate>
            <TokenBalance
              token={USDC_ADDRESS}
              icon="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png"
            />
          </WalletGate>
        </StorySection>

        <StorySection
          title="Icon Fallback"
          description="When icon URL is not provided - deterministic colored circle from symbol"
          code={`<TokenBalance showIcon />`}
        >
          <WalletGate>
            <div className="story-row">
              <TokenBalance showIcon />
              <TokenBalance token={USDC_ADDRESS} showIcon />
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
          title="Hide Fiat"
          code={`<TokenBalance showFiat={false} />`}
        >
          <WalletGate>
            <TokenBalance showFiat={false} />
          </WalletGate>
        </StorySection>

        <StorySection
          title="EUR Currency"
          code={`<TokenBalance fiatCurrency="EUR" />`}
        >
          <WalletGate>
            <TokenBalance fiatCurrency="EUR" />
          </WalletGate>
        </StorySection>

        <StorySection
          title="Custom Render (children-as-function)"
          code={`<TokenBalance token={USDC}>
  {({ formatted, symbol, fiatFormatted, isLoading }) => (
    <div>
      <strong>{formatted} {symbol}</strong>
      <span>{fiatFormatted}</span>
    </div>
  )}
</TokenBalance>`}
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
                          <strong className="custom-balance-amount">
                            {formatted} {symbol}
                          </strong>
                          {
                            fiatFormatted && (
                              <span className="custom-balance-fiat">{fiatFormatted}</span>
                            )
                          }
                        </>
                      )
                  }
                </div>
              )}
            </TokenBalance>
          </WalletGate>
        </StorySection>

        <StorySection
          title="Split Styling (integer/fraction)"
          description="Integer part is bolder, fraction is lighter - visible on real balance"
          code={`<TokenBalance />
// .txkit-tb-integer { font-weight: 600 }
// .txkit-tb-fraction { font-weight: 400; opacity: 0.7 }`}
        >
          <WalletGate>
            <TokenBalance />
          </WalletGate>
        </StorySection>

        <StorySection
          title="Manual Price Override"
          description="Uses price=1.0 (stablecoin override)"
          code={`<TokenBalance token={USDC} price={1.0} />`}
        >
          <WalletGate>
            <TokenBalance
              token={USDC_ADDRESS}
              price={1.0}
            />
          </WalletGate>
        </StorySection>

        <StorySection
          title="Block-Based Refresh"
          description="Balance updates on new blocks instead of polling. Shows current block number from BalanceWatcher context"
          code={`const { lastBlockNumber } = useBalanceContext()
// Balances auto-refresh on each new block
// Tab visibility: pauses when tab is hidden`}
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
          description="Full data access via useTokenBalance hook"
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
      </div>
    </TxKitProvider>
  )
}


export default TokenBalanceStory
