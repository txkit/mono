import { useState } from 'react'

import { mainnetOnlyConfig, useStoryConfig } from '../../config'
import PreviewTab from './PreviewTab'
import LiveTab from './LiveTab'
import ExamplesTab from './ExamplesTab'


const TokenBalanceStory = ({ variant }: { variant: TxKit.Variant }) => {
  const config = useStoryConfig(mainnetOnlyConfig, 'dark', variant)
  const [ tab, setTab ] = useState<'preview' | 'live' | 'examples'>('preview')

  return (
    <div>
      <div className="story-tabs">
        <button type="button" className={`story-tab ${tab === 'preview' ? 'active' : ''}`} onClick={() => setTab('preview')}>
          Preview
        </button>
        <button type="button" className={`story-tab ${tab === 'live' ? 'active' : ''}`} onClick={() => setTab('live')}>
          Live
        </button>
        <button type="button" className={`story-tab ${tab === 'examples' ? 'active' : ''}`} onClick={() => setTab('examples')}>
          Examples
        </button>
      </div>
      {tab === 'preview' && <PreviewTab />}
      {tab === 'live' && <LiveTab config={config} />}
      {tab === 'examples' && <ExamplesTab config={config} />}
    </div>
  )
}


export default TokenBalanceStory
