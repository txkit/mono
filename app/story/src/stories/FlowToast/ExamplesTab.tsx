import { StorySection } from '../../components'
import dedent from '../../helpers/dedent'
import ToastTrigger from './ToastTrigger'


const ExamplesTab = () => (
  <>
    <p className="story-description">Production recipes for FlowToast. Click any trigger to surface a real toast - it portals to document.body, so toasts from different examples appear at their own corner</p>

    <StorySection
      title="Default"
      useWhen="Drop one FlowToast at the root of your layout - it portals to document.body and only renders on terminal flow statuses"
      code={dedent`
        import { FlowToast, TransactionButton, txStep } from '@txkit/react'
        import { parseEther } from 'viem'

        const RECIPIENT = '0xaC8e0D90b7dc16D63ad77d9CDd71e3DAb45ABE51' // your recipient

        const App = () => (
          <>
            <TransactionButton
              flowId="checkout"
              steps={[
                txStep('send', 'Send', { to: RECIPIENT, value: parseEther('0.01') }),
              ]}
            />
            <FlowToast flowId="checkout" />
          </>
        )
      `}
    >
      <ToastTrigger
        flowId="ex-toast-default"
        terminal="completed"
        label="Trigger success toast"
      />
    </StorySection>

    <StorySection
      title="Position override"
      useWhen="Match an existing toast region's anchor in the layout - bottom-left, top-right, or wherever your app already places notifications"
      code={dedent`
        import { FlowToast } from '@txkit/react'

        const Notifications = () => (
          <FlowToast flowId="checkout" position="top-right" />
        )
      `}
    >
      <div className="story-toast-trigger-row">
        <ToastTrigger
          flowId="ex-toast-position-tr"
          terminal="completed"
          label="Top-right"
          position="top-right"
        />
        <ToastTrigger
          flowId="ex-toast-position-tl"
          terminal="completed"
          label="Top-left"
          position="top-left"
        />
        <ToastTrigger
          flowId="ex-toast-position-bl"
          terminal="completed"
          label="Bottom-left"
          position="bottom-left"
        />
      </div>
    </StorySection>

    <StorySection
      title="Auto-dismiss off"
      useWhen="Sticky toast for critical errors that must be acknowledged. Set autoDismiss={0} - errors are sticky by default, so this targets success/info toasts"
      code={dedent`
        import { FlowToast } from '@txkit/react'

        const StickyToast = () => (
          <FlowToast flowId="checkout" autoDismiss={0} />
        )
      `}
    >
      <ToastTrigger
        flowId="ex-toast-sticky"
        terminal="completed"
        label="Trigger sticky toast"
        autoDismiss={0}
      />
    </StorySection>

    <StorySection
      title="Multiple flows (per-flowId)"
      useWhen="Run two flows side by side and surface each via its own toast. Distinct flowIds keep state isolated; multiple toasts at the same position stack automatically"
      code={dedent`
        import { FlowToast, TransactionButton, approveAndExecute, txStep } from '@txkit/react'
        import { erc20Abi, parseUnits } from 'viem'
        import { USDC_ADDRESS, SWAP_ROUTER, swapTx } from './constants'

        const approveSteps = approveAndExecute({
          token: USDC_ADDRESS,
          spender: SWAP_ROUTER,
          amount: parseUnits('100', 6),
          tx: { address: USDC_ADDRESS, abi: erc20Abi, functionName: 'approve', args: [ SWAP_ROUTER, parseUnits('100', 6) ] },
          label: 'Approve USDC',
        })

        const swapSteps = [ txStep('swap', 'Swap', swapTx) ]

        // Both FlowToasts share the default bottom-right anchor - the second one
        // mounts above the first via internal stack registry, no extra config.
        const App = () => (
          <>
            <TransactionButton flowId="approve" steps={approveSteps} />
            <TransactionButton flowId="swap" steps={swapSteps} />

            <FlowToast flowId="approve" />
            <FlowToast flowId="swap" />
          </>
        )
      `}
    >
      <div className="story-toast-trigger-row">
        <ToastTrigger
          flowId="ex-toast-multi-approve"
          terminal="completed"
          label="Approve toast"
        />
        <ToastTrigger
          flowId="ex-toast-multi-swap"
          terminal="completed"
          label="Swap toast"
        />
      </div>
    </StorySection>
  </>
)


export default ExamplesTab
