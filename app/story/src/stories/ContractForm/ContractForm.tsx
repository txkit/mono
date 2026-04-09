import StoryTabs from '../shared/StoryTabs'
import LiveTab from './LiveTab'
import ExamplesTab from './ExamplesTab'
import { defaultConfig, useStoryConfig } from '../../config'


const ContractFormStory = ({ variant }: { variant: TxKit.Variant }) => {
  const config = useStoryConfig(defaultConfig, 'dark', variant)

  return (
    <StoryTabs tabs={[
      { id: 'live', label: 'Live', content: <LiveTab config={config} /> },
      { id: 'examples', label: 'Examples', content: <ExamplesTab config={config} /> },
    ]} />
  )
}


export default ContractFormStory
