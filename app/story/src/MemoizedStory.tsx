import React from 'react'

import ThemeShowcaseStory from './stories/ThemeShowcase/ThemeShowcase'
import ContractFormStory from './stories/ContractForm/ContractForm'
import TokenBalanceStory from './stories/TokenBalance/TokenBalance'
import ConnectWalletStory from './stories/ConnectWallet/ConnectWallet'
import TxKitProviderStory from './stories/TxKitProvider/TxKitProvider'
import TransactionButtonStory from './stories/TransactionButton/TransactionButton'


const stories = {
  ConnectWallet: ConnectWalletStory,
  TokenBalance: TokenBalanceStory,
  TransactionButton: TransactionButtonStory,
  ContractForm: ContractFormStory,
  TxKitProvider: TxKitProviderStory,
  ThemeShowcase: ThemeShowcaseStory,
} as const

export type StoryName = keyof typeof stories

/** Memoized story renderer - prevents wagmi useSyncExternalStore crash
 *  when playground theme/colorScheme changes trigger parent re-render.
 *  Variant is passed as prop so stories don't subscribe to PlaygroundContext
 *  (context subscription bypasses React.memo and triggers wagmi infinite loops). */
const MemoizedStory = React.memo(({ name, variant }: { name: StoryName; variant: TxKit.Variant }) => {
  const Story = stories[name]
  return <Story variant={variant} />
})
MemoizedStory.displayName = 'MemoizedStory'


export default MemoizedStory
