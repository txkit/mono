import StoryTabs from '../shared/StoryTabs'
import CfLiveTab from './LiveTab'
import CfExamplesTab from './ExamplesTab'
import { defaultConfig, useStoryConfig } from '../../config'


const ContractFormStory = ({ variant }: { variant: TxKit.Variant }) => {
  const config = useStoryConfig(defaultConfig, 'dark', variant)

  return (
    <StoryTabs tabs={[
      { id: 'live', label: 'Live', content: <CfLiveTab config={config} /> },
      { id: 'examples', label: 'Examples', content: <CfExamplesTab config={config} /> },
    ]} />
  )
}


export default ContractFormStory
