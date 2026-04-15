import { StoryTabs } from '../../components'
import LiveTab from './LiveTab'
import MockPreview from './MockPreview'
import ExamplesTab from './ExamplesTab'


const ConnectWalletStory = () => (
  <StoryTabs tabs={[
    { id: 'preview', label: 'Preview', content: <MockPreview /> },
    { id: 'live', label: 'Live', content: <LiveTab /> },
    { id: 'examples', label: 'Examples', content: <ExamplesTab /> },
  ]} />
)


export default ConnectWalletStory
