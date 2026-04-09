import { useState } from 'react'

import LiveTab from './LiveTab'
import MockPreview from './MockPreview'
import ExamplesTab from './ExamplesTab'
import { defaultConfig, useStoryConfig } from '../../config'


const TransactionButtonStory = ({ variant }: { variant: TxKit.Variant }) => {
  const config = useStoryConfig(defaultConfig, 'dark', variant)
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
      {tab === 'preview' && <MockPreview />}
      {tab === 'live' && <LiveTab config={config} />}
      {tab === 'examples' && <ExamplesTab config={config} />}
    </div>
  )
}


export default TransactionButtonStory
