import StoryTabs from '../shared/StoryTabs'
import PreviewTab from './PreviewTab'
import LiveTab from './LiveTab'
import ExamplesTab from './ExamplesTab'
import { mainnetOnlyConfig, useStoryConfig } from '../../config'


const TokenBalanceStory = ({ variant }: { variant: TxKit.Variant }) => {
  const config = useStoryConfig(mainnetOnlyConfig, 'dark', variant)

  return (
    <StoryTabs tabs={[
      { id: 'preview', label: 'Preview', content: <PreviewTab /> },
      { id: 'live', label: 'Live', content: <LiveTab config={config} /> },
      { id: 'examples', label: 'Examples', content: <ExamplesTab config={config} /> },
    ]} />
  )
}


export default TokenBalanceStory
