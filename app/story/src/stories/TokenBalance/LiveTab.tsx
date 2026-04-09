import { TxKitProvider } from '@txkit/react'

import InteractiveTokenBalance from './InteractiveTokenBalance'


const LiveTab = ({ config }: { config: TxKit.Config }) => (
  <TxKitProvider config={config}>
    <p className="story-description">Real component - connect a wallet to see live balances</p>
    <InteractiveTokenBalance />
  </TxKitProvider>
)


export default LiveTab
