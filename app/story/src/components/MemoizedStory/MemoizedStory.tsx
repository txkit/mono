import React, { Suspense, lazy } from 'react'


const stories = {
  ConnectWallet: lazy(() => import('../../stories/ConnectWallet/ConnectWallet')),
  TokenBalance: lazy(() => import('../../stories/TokenBalance/TokenBalance')),
  TransactionButton: lazy(() => import('../../stories/TransactionButton/TransactionButton')),
  TxKitProvider: lazy(() => import('../../stories/TxKitProvider/TxKitProvider')),
  ThemeShowcase: lazy(() => import('../../stories/ThemeShowcase/ThemeShowcase')),
} as const

export type StoryName = keyof typeof stories

/** Memoized story renderer with stable identity - the App-level <TxKitProvider>
 *  stays mounted across story switches; React.memo + key={name} (caller side)
 *  ensures clean unmount/mount of story content without recreating wagmi store. */
const MemoizedStory = React.memo(({ name }: { name: StoryName }) => {
  const Story = stories[name]
  return (
    <Suspense fallback={null}>
      <Story />
    </Suspense>
  )
})
MemoizedStory.displayName = 'MemoizedStory'


export default MemoizedStory
