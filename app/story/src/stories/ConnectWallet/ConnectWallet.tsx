import StoryTabs from '../shared/StoryTabs'
import LiveTab from './LiveTab'
import MockPreview from './MockPreview'
import ExamplesTab from './ExamplesTab'
import { defaultConfig, mainnetOnlyConfig, useStoryConfig } from '../../config'


const ConnectWalletStory = ({ variant }: { variant: TxKit.Variant }) => {
  const config = useStoryConfig(defaultConfig, 'dark', variant)
  const darkConfig = useStoryConfig(mainnetOnlyConfig, 'dark', variant)
  const lightConfig = useStoryConfig(mainnetOnlyConfig, 'light', variant)

  return (
    <StoryTabs tabs={[
      { id: 'preview', label: 'Preview', content: <MockPreview /> },
      { id: 'live', label: 'Live', content: <LiveTab config={config} /> },
      { id: 'examples', label: 'Examples', content: <ExamplesTab config={config} darkConfig={darkConfig} lightConfig={lightConfig} /> },
    ]} />
  )
}


export default ConnectWalletStory
