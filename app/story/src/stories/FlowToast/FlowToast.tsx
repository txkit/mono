import { StoryTabs } from '../../components'
import PreviewTab from './PreviewTab'
import ExamplesTab from './ExamplesTab'

import './FlowToast.css'


const FlowToastStory = () => (
  <StoryTabs tabs={[
    { id: 'preview', label: 'Preview', content: <PreviewTab /> },
    { id: 'examples', label: 'Examples', content: <ExamplesTab /> },
  ]} />
)


export default FlowToastStory
