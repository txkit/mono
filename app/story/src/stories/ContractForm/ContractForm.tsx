import { useState } from 'react'

import { defaultConfig, useStoryConfig } from '../../config'
import CfLiveTab from './LiveTab'
import CfExamplesTab from './ExamplesTab'


const ContractFormStory = ({ variant }: { variant: TxKit.Variant }) => {
  const config = useStoryConfig(defaultConfig, 'dark', variant)
  const [ tab, setTab ] = useState<'live' | 'examples'>('live')

  return (
    <div>
      <div className="story-tabs">
        <button type="button" className={`story-tab ${tab === 'live' ? 'active' : ''}`} onClick={() => setTab('live')}>
          Live
        </button>
        <button type="button" className={`story-tab ${tab === 'examples' ? 'active' : ''}`} onClick={() => setTab('examples')}>
          Examples
        </button>
      </div>
      {tab === 'live' && <CfLiveTab config={config} />}
      {tab === 'examples' && <CfExamplesTab config={config} />}
    </div>
  )
}


export default ContractFormStory
