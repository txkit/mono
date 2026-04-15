import { useBalanceContext } from '@txkit/react'

import { InfoGrid } from '../../components'


const BlockWatcherDemo = () => {
  const context = useBalanceContext()

  return (
    <InfoGrid entries={[
      { label: 'Last Block', value: context?.lastBlockNumber?.toString() ?? 'waiting...' },
      { label: 'Status', value: context ? 'Block watcher active' : 'No BalanceContext' },
    ]} />
  )
}


export default BlockWatcherDemo
