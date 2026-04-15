import { StoryTabs } from '../../components'
import LiveTab from './LiveTab'
import ExamplesTab from './ExamplesTab'


const ContractFormStory = () => (
  <StoryTabs tabs={[
    { id: 'live', label: 'Live', content: <LiveTab /> },
    { id: 'examples', label: 'Examples', content: <ExamplesTab /> },
  ]} />
)


export default ContractFormStory
