import { FlowSteps, useFlowState } from '@txkit/react'

import { StorySection } from '../../components'
import dedent from '../../helpers/dedent'
import useMockFlow from '../TransactionButton/useMockFlow'


const FLOW_DEFAULT = 'ex-fs-default'
const FLOW_VERTICAL = 'ex-fs-vertical'
const FLOW_CUSTOM = 'ex-fs-custom'
const FLOW_HEADLESS = 'ex-fs-headless'


const CustomRenderDemo = () => {
  useMockFlow({ activeState: 'tx-pending', stepsCount: 3, flowId: FLOW_CUSTOM })

  return (
    <FlowSteps flowId={FLOW_CUSTOM}>
      {(data) => (
        <ol className="story-fs-custom-list">
          {
            data.steps.map((step) => (
              <li key={step.id} className="story-fs-custom-item" data-status={step.status}>
                <span className="story-fs-custom-status">{step.status}</span>
                <span className="story-fs-custom-label">{step.label}</span>
              </li>
            ))
          }
        </ol>
      )}
    </FlowSteps>
  )
}


const HeadlessDemo = () => {
  useMockFlow({ activeState: 'tx-pending', stepsCount: 3, flowId: FLOW_HEADLESS })
  const entry = useFlowState(FLOW_HEADLESS)

  if (!entry) {
    return null
  }

  const { flow, steps } = entry

  return (
    <pre className="story-fs-headless">
      Step {flow.currentStepIndex + 1} of {steps.length}
      {'\n'}Status: {flow.status}
    </pre>
  )
}


const ExamplesTab = () => {
  useMockFlow({ activeState: 'tx-pending', stepsCount: 2, flowId: FLOW_DEFAULT })
  useMockFlow({ activeState: 'tx-pending', stepsCount: 3, flowId: FLOW_VERTICAL })

  return (
    <>
      <p className="story-description">Production recipes for FlowSteps. Each example pairs a use-case hint with a copyable snippet</p>

      <StorySection
        title="Horizontal"
        useWhen="Render a row of step indicators above or beside TransactionButton. Connectors fill the gaps and steps stay center-aligned for any number of steps"
        code={dedent`
          import { FlowSteps, TransactionButton, txStep } from '@txkit/react'
          import { parseEther } from 'viem'

          const RECIPIENT = '0xaC8e0D90b7dc16D63ad77d9CDd71e3DAb45ABE51' // your recipient

          const Checkout = () => (
            <>
              <FlowSteps flowId="checkout" orientation="horizontal" />
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
        <FlowSteps flowId={FLOW_DEFAULT} orientation="horizontal" />
      </StorySection>

      <StorySection
        title="Vertical (sidebar layout)"
        useWhen="Default orientation. Use it for sidebars or wide-detail panels where horizontal real estate is constrained"
        code={dedent`
          import { FlowSteps } from '@txkit/react'

          const Sidebar = () => (
            <aside style={{ position: 'sticky', top: 16, width: 240 }}>
              <FlowSteps flowId="checkout" />
            </aside>
          )
        `}
      >
        <div style={{ maxWidth: 240 }}>
          <FlowSteps flowId={FLOW_VERTICAL} />
        </div>
      </StorySection>

      <StorySection
        title="Custom render (Tier 2)"
        useWhen="Render your own list / table / progress widget from FlowStepsRenderData. Component owns state, you own layout"
        code={dedent`
          import { FlowSteps } from '@txkit/react'

          const Custom = () => (
            <FlowSteps flowId="checkout">
              {(data) => (
                <ol>
                  {data.steps.map((step) => (
                    <li key={step.id} data-status={step.status}>
                      {step.label} - {step.status}
                    </li>
                  ))}
                </ol>
              )}
            </FlowSteps>
          )
        `}
      >
        <CustomRenderDemo />
      </StorySection>

      <StorySection
        title="Headless via useFlowState (Tier 3)"
        useWhen="Need step state in code that does not render the visual progress (analytics, conditional UI, custom routing)"
        code={dedent`
          import { useFlowState } from '@txkit/react'

          const FlowDebug = () => {
            const entry = useFlowState('checkout')
            if (!entry) {
              return null
            }

            const { flow, steps } = entry

            return (
              <pre>
                Step {flow.currentStepIndex + 1} of {steps.length}
                Status: {flow.status}
              </pre>
            )
          }
        `}
      >
        <HeadlessDemo />
      </StorySection>
    </>
  )
}


export default ExamplesTab
