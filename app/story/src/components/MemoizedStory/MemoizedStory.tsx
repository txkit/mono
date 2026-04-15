import React from 'react'

import ThemeShowcaseStory from '../../stories/ThemeShowcase/ThemeShowcase'
import TokenBalanceStory from '../../stories/TokenBalance/TokenBalance'
import ConnectWalletStory from '../../stories/ConnectWallet/ConnectWallet'
import TxKitProviderStory from '../../stories/TxKitProvider/TxKitProvider'
import TransactionButtonStory from '../../stories/TransactionButton/TransactionButton'


const stories = {
  ConnectWallet: ConnectWalletStory,
  TokenBalance: TokenBalanceStory,
  TransactionButton: TransactionButtonStory,
  TxKitProvider: TxKitProviderStory,
  ThemeShowcase: ThemeShowcaseStory,
} as const

export type StoryName = keyof typeof stories

/** Memoized story renderer with stable identity - the App-level <TxKitProvider>
 *  stays mounted across story switches; React.memo + key={name} (caller side)
 *  ensures clean unmount/mount of story content without recreating wagmi store. */
const MemoizedStory = React.memo(({ name }: { name: StoryName }) => {
  const Story = stories[name]
  return <Story />
})
MemoizedStory.displayName = 'MemoizedStory'


export default MemoizedStory
