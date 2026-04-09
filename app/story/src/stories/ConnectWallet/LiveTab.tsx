import { TxKitProvider } from '@txkit/react'

import InteractiveConnectWallet from './InteractiveConnectWallet'


const LiveTab = ({ config }: { config: TxKit.Config }) => (
  <TxKitProvider config={config}>
    <p className="story-description">Real component - connect a wallet to test all states</p>
    <InteractiveConnectWallet />
  </TxKitProvider>
)


export default LiveTab
