import { TxKitProvider } from '@txkit/react'

import InteractiveTransactionButton from './InteractiveTransactionButton'


const LiveTab = ({ config }: { config: TxKit.Config }) => (
  <TxKitProvider config={config}>
    <p className="story-description">Real component - connect a wallet to test transactions</p>
    <InteractiveTransactionButton />
  </TxKitProvider>
)


export default LiveTab
