import StoryTabs from '../shared/StoryTabs'
import LiveTab from './LiveTab'
import MockPreview from './MockPreview'
import ExamplesTab from './ExamplesTab'
import { defaultConfig, useStoryConfig } from '../../config'


const TransactionButtonStory = ({ variant }: { variant: TxKit.Variant }) => {
  const config = useStoryConfig(defaultConfig, 'dark', variant)

  return (
    <StoryTabs tabs={[
      { id: 'preview', label: 'Preview', content: <MockPreview /> },
      { id: 'live', label: 'Live', content: <LiveTab config={config} /> },
      { id: 'examples', label: 'Examples', content: <ExamplesTab config={config} /> },
    ]} />
  )
}


export default TransactionButtonStory
