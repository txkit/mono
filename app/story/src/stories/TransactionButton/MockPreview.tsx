import { useMemo } from 'react'
import type { DecodedCalldata } from '@txkit/core'
import { FlowSteps, FlowProgress, FlowToast } from '@txkit/react'
import DecodedCalldataPreview from '@txkit/react/components/TransactionButton/DecodedCalldataPreview/DecodedCalldataPreview'

import useCountdown from '../../helpers/useCountdown'
import { useControls, ControlPanel, StatePanel, CodeBlock, useTxkitThemeClass } from '../../components'
import { buildSepoliaFlowSnippet } from './sepoliaFlows'
import useMockFlow from './useMockFlow'
import { TXB_STATES } from './states'

const stateLabels: Record<string, string> = {
  pending: 'Send 0.001 ETH',
  simulating: 'Simulating...',
  'confirming-risk': 'Confirm Risk',
  'simulation-failed': 'Send Anyway',
  signing: 'Confirm in Wallet',
  'tx-pending': 'Transaction Pending',
  waiting: 'Waiting...',
  completed: 'Completed',
  skipped: 'Skipped',
  error: 'Try Again',
  rejected: 'Try Again',
  canceled: 'Try Again',
}

const disabledStates: readonly string[] = [ 'signing', 'tx-pending', 'waiting' ]

const MAX_UINT256 = (1n << 256n) - 1n

const transferDecoded: DecodedCalldata = {
  functionName: 'transfer',
  args: [
    { name: 'to', type: 'address', value: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' },
    { name: 'amount', type: 'uint256', value: 1000000000000000n },
  ],
}

const approveMaxDecoded: DecodedCalldata = {
  functionName: 'approve',
  args: [
    { name: 'spender', type: 'address', value: '0x000000000022D473030F116dDEE9F6B43aC78BA3' },
    { name: 'amount', type: 'uint256', value: MAX_UINT256 },
  ],
}

const transferWarnings: readonly string[] = [
  'Sending ETH to an address that has not been seen before. Verify the recipient.',
]

const maxApprovalWarnings: readonly string[] = [
  'Unlimited approval (MAX_UINT256). The spender can drain the entire balance at any time. Prefer approving the exact amount needed.',
]

const toastStates: readonly string[] = [ 'completed', 'error', 'rejected', 'simulation-failed', 'canceled' ]

const MockPreview = () => {
  const txkitThemeClass = useTxkitThemeClass()
  const schema = useMemo(() => ({
    state: { type: 'state' as const, default: 'pending', states: TXB_STATES },
    label: { type: 'string' as const, default: 'Send 0.001 ETH' },
    stepsCount: { type: 'number' as const, default: 2, min: 1, max: 5, step: 1 },
    safetyDelayMs: { type: 'number' as const, default: 0, min: 0, max: 10000, step: 1000 },
    simulate: { type: 'boolean' as const, default: true },
    warnMaxApproval: { type: 'boolean' as const, default: true },
    showExplorerLink: { type: 'boolean' as const, default: true },
    showSteps: { type: 'boolean' as const, default: true },
    showProgress: { type: 'boolean' as const, default: true },
    showToast: { type: 'boolean' as const, default: true },
    disabled: { type: 'boolean' as const, default: false },
  }), [])

  const { values, entries, isDefault, reset } = useControls(schema)
  const activeState = String(values.state ?? 'pending')
  const stepsCount = Math.max(1, Math.min(5, Number(values.stepsCount ?? 2)))
  const safetyDelayMs = Math.max(0, Math.min(10000, Number(values.safetyDelayMs ?? 0)))
  const isUserDisabled = Boolean(values.disabled)
  const isSimulateOn = values.simulate !== false
  const isMaxApprovalOn = values.warnMaxApproval !== false
  const dataState = activeState === 'pending' ? 'idle' : activeState
  const stateEntry = entries.find((e) => e.def.type === 'state')
  const dimmedKeys = useMemo(() => {
    const keys: string[] = [ 'showExplorerLink' ]
    if (!toastStates.includes(activeState)) {
      keys.push('showToast')
    }
    return keys
  }, [ activeState ])

  const isCountingDown = activeState === 'confirming-risk' && safetyDelayMs > 0
  const { remainingMs, isExpired } = useCountdown({ durationMs: safetyDelayMs, isActive: isCountingDown })
  const isWaitingForCountdown = isCountingDown && !isExpired

  const setMockState = (next: string) => {
    stateEntry?.setValue(next)
  }

  const handleMainClick = () => {
    if (activeState === 'pending') {
      setMockState(isSimulateOn ? 'simulating' : 'signing')
      return
    }
    if (activeState === 'confirming-risk') {
      if (isWaitingForCountdown) {return}
      setMockState('signing')
      return
    }
    if (activeState === 'simulation-failed') {
      setMockState('signing')
      return
    }
    if (activeState === 'error' || activeState === 'rejected' || activeState === 'canceled') {
      setMockState(isSimulateOn ? 'simulating' : 'signing')
      return
    }
    if (activeState === 'completed') {
      setMockState('pending')
    }
  }

  useMockFlow({ activeState, stepsCount, warnMaxApproval: isMaxApprovalOn })

  const userLabel = String(values.label ?? '').trim()
  const pendingLabel = userLabel === '' ? 'Send 0.001 ETH' : userLabel
  const getButtonLabel = (): string => {
    if (isWaitingForCountdown) {
      return `Confirm in ${Math.ceil(remainingMs / 1000)}s...`
    }
    if (activeState === 'pending') {
      return pendingLabel
    }
    return stateLabels[activeState] ?? pendingLabel
  }
  const buttonLabel = getButtonLabel()

  const previewSnippet = useMemo(() => {
    const stepLines = buildSepoliaFlowSnippet(stepsCount)
    const trailingJsx: string[] = [ '    <TransactionButton steps={steps} />' ]
    if (values.showProgress) {
      trailingJsx.push('    <FlowProgress />')
    }
    if (values.showSteps) {
      trailingJsx.push('    <FlowSteps orientation="vertical" />')
    }
    if (values.showToast) {
      trailingJsx.push('    <FlowToast />')
    }
    const lines: string[] = [
      "import { TransactionButton, FlowProgress, FlowSteps, FlowToast, txStep } from '@txkit/react'",
      "import { parseEther } from 'viem'",
      '',
      ...stepLines,
      '',
      'const MyComponent: React.FC = () => (',
      '  <>',
      ...trailingJsx,
      '  </>',
      ')',
    ]
    return lines.join('\n')
  }, [ stepsCount, values.showProgress, values.showSteps, values.showToast ])

  return (
    <>
      <p className="story-description">Pick a state - button and compound components (FlowSteps / FlowProgress / FlowToast) update together via shared TxKitProvider context</p>
      <div className="story-live-layout">
        <div className="story-live-left">
          <StatePanel entry={stateEntry} />
          <div className="story-live-preview-card">
            <div className={`tx-root ${txkitThemeClass} story-live-preview-inner`}>
              <div className="tx-txb">
                <button
                  type="button"
                  className="tx-txb-button"
                  data-state={dataState}
                  disabled={isUserDisabled || disabledStates.includes(activeState) || isWaitingForCountdown}
                  onClick={handleMainClick}
                >
                  {buttonLabel}
                </button>
                {
                  activeState === 'confirming-risk' && (
                    <div
                      className="tx-txb-details"
                      data-expanded="true"
                      role="region"
                      aria-label="Transaction details"
                    >
                      <DecodedCalldataPreview
                        decoded={isMaxApprovalOn ? approveMaxDecoded : transferDecoded}
                        warnings={isMaxApprovalOn ? [ ...maxApprovalWarnings ] : [ ...transferWarnings ]}
                        riskLevel={isMaxApprovalOn ? 'high' : 'medium'}
                      />
                      <button type="button" className="tx-txb-cancel" onClick={() => setMockState('canceled')}>Cancel</button>
                    </div>
                  )
                }
                {
                  activeState === 'simulation-failed' && (
                    <div className="tx-txb-details" data-expanded="true" role="alert">
                      <div className="tx-txb-details-error">Simulation failed: insufficient funds for gas</div>
                    </div>
                  )
                }
              </div>
              {values.showProgress && <FlowProgress />}
              {values.showSteps && <FlowSteps orientation="vertical" />}
              {values.showToast && <FlowToast />}
            </div>
          </div>
          <CodeBlock code={previewSnippet} />
        </div>
        <div className="story-live-right">
          <ControlPanel entries={entries} dimmedKeys={dimmedKeys} isDefault={isDefault} onReset={reset} />
        </div>
      </div>
    </>
  )
}


export default MockPreview
