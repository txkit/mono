import { StoryTabs } from '../../components'
import PreviewTab from './PreviewTab'
import LiveTab from './LiveTab'
import ExamplesTab from './ExamplesTab'


const TokenBalanceStory = () => (
  <StoryTabs tabs={[
    { id: 'preview', label: 'Preview', content: <PreviewTab /> },
    { id: 'live', label: 'Live', content: <LiveTab /> },
    { id: 'examples', label: 'Examples', content: <ExamplesTab /> },
  ]} />
)


export default TokenBalanceStory
