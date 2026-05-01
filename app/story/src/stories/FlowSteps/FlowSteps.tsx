import { StoryTabs } from '../../components'
import PreviewTab from './PreviewTab'
import ExamplesTab from './ExamplesTab'

import './FlowSteps.css'


const FlowStepsStory = () => (
  <StoryTabs tabs={[
    { id: 'preview', label: 'Preview', content: <PreviewTab /> },
    { id: 'examples', label: 'Examples', content: <ExamplesTab /> },
  ]} />
)


export default FlowStepsStory
