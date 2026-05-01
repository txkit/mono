import { FlowProgress, useFlowState } from '@txkit/react'

import { StorySection } from '../../components'
import dedent from '../../helpers/dedent'
import useMockFlow from '../TransactionButton/useMockFlow'


const FLOW_DEFAULT = 'ex-fp-default'
const FLOW_SUMMARY = 'ex-fp-summary'
const FLOW_CUSTOM = 'ex-fp-custom'
const FLOW_HEADLESS = 'ex-fp-headless'


const CustomRenderDemo = () => {
  useMockFlow({ activeState: 'tx-pending', stepsCount: 3, flowId: FLOW_CUSTOM })

  return (
    <FlowProgress flowId={FLOW_CUSTOM}>
      {
        (data) => (
          <div className="story-fp-custom" role="progressbar" aria-valuenow={Math.round(data.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
            <span className="story-fp-custom-label">{data.currentStepLabel ?? 'In progress'}</span>
            <div className="story-fp-custom-track">
              <div className="story-fp-custom-fill" style={{ width: `${data.progress * 100}%` }} />
            </div>
          </div>
        )
      }
    </FlowProgress>
  )
}


const HeadlessDemo = () => {
  useMockFlow({ activeState: 'tx-pending', stepsCount: 4, flowId: FLOW_HEADLESS })
  const entry = useFlowState(FLOW_HEADLESS)

  if (!entry) {
    return null
  }

  const { flow } = entry
  const percent = Math.round(((flow.currentStepIndex + 1) / flow.totalSteps) * 100)

  return (
    <span className="story-fp-headless">{percent}% complete</span>
  )
}


const ExamplesTab = () => {
  useMockFlow({ activeState: 'tx-pending', stepsCount: 2, flowId: FLOW_DEFAULT })
  useMockFlow({ activeState: 'tx-pending', stepsCount: 4, flowId: FLOW_SUMMARY })

  return (
    <>
      <p className="story-description">Production recipes for FlowProgress. Each example pairs a use-case hint with a copyable snippet</p>

      <StorySection
        title="Default"
        useWhen="Compact progress strip wherever you need a slim visual signal that the flow is moving"
        code={dedent`
          import { FlowProgress, TransactionButton, txStep } from '@txkit/react'
          import { parseEther } from 'viem'

          const RECIPIENT = '0xaC8e0D90b7dc16D63ad77d9CDd71e3DAb45ABE51' // your recipient

          const Checkout = () => (
            <>
              <FlowProgress flowId="checkout" />
              <TransactionButton
                flowId="checkout"
                steps={[
                  txStep('send', 'Send', { to: RECIPIENT, value: parseEther('0.01') }),
                ]}
              />
            </>
          )
        `}
      >
        <div className="story-fp-stage">
          <FlowProgress flowId={FLOW_DEFAULT} />
        </div>
      </StorySection>

      <StorySection
        title="Without summary"
        useWhen="Hide the 'Overall Progress' counter for a slim, label-free strip - works well as a sub-header bar"
        code={dedent`
          import { FlowProgress } from '@txkit/react'

          const SlimBar = () => (
            <FlowProgress flowId="checkout" showSummary={false} />
          )
        `}
      >
        <div className="story-fp-stage">
          <FlowProgress flowId={FLOW_SUMMARY} showSummary={false} />
        </div>
      </StorySection>

      <StorySection
        title="Custom render (Tier 2)"
        useWhen="Build your own progress visual on top of the data - branded gradients, custom labels, segmented bars"
        code={dedent`
          import { FlowProgress } from '@txkit/react'

          const Custom = () => (
            <FlowProgress flowId="checkout">
              {(data) => (
                <div role="progressbar" aria-valuenow={Math.round(data.progress * 100)}>
                  <span>{data.currentStepLabel}</span>
                  <div style={{ width: \`\${data.progress * 100}%\` }} />
                </div>
              )}
            </FlowProgress>
          )
        `}
      >
        <div className="story-fp-stage">
          <CustomRenderDemo />
        </div>
      </StorySection>

      <StorySection
        title="Headless via useFlowState (Tier 3)"
        useWhen="Read currentStepIndex / totalSteps without rendering a progress bar - drives custom analytics, conditional UI, or external dashboards"
        code={dedent`
          import { useFlowState } from '@txkit/react'

          const ProgressLabel = () => {
            const entry = useFlowState('checkout')
            if (!entry) {
              return null
            }

            const { flow } = entry
            const percent = Math.round(((flow.currentStepIndex + 1) / flow.totalSteps) * 100)

            return <span>{percent}% complete</span>
          }
        `}
      >
        <div className="story-fp-stage">
          <HeadlessDemo />
        </div>
      </StorySection>
    </>
  )
}


export default ExamplesTab
