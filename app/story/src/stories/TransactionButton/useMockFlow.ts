import { useEffect } from 'react'
import type { FlowStatus, StepStatus } from '@txkit/core'
import {
  useFlowStore,
  setFlowEntry,
  notifyFlowListeners,
  DEFAULT_FLOW_ID,
} from '@txkit/react'
import type {
  FlowActions,
  FlowState,
  FlowStep,
  StepState,
} from '@txkit/react'


/**
 * Mock flow injector - writes a 2-step FlowEntry into the shared FlowStore
 * so real FlowSteps / FlowProgress / FlowToast compound components render
 * against mocked state (no real transactions).
 *
 * Used in TransactionButton Preview tab to demonstrate compound auto-sync.
 */

const noop = () => {}

type StepMeta = { id: string; label: string }

const stepCatalog: Record<number, readonly StepMeta[]> = {
  1: [
    { id: 'weth-deposit', label: 'Wrap 0.001 ETH' },
  ],
  2: [
    { id: 'weth-deposit', label: 'Wrap 0.001 ETH' },
    { id: 'weth-withdraw', label: 'Unwrap 0.001 WETH' },
  ],
  3: [
    { id: 'weth-deposit', label: 'Wrap 0.001 ETH' },
    { id: 'weth-approve', label: 'Approve WETH (0.001)' },
    { id: 'weth-withdraw', label: 'Unwrap 0.001 WETH' },
  ],
  4: [
    { id: 'weth-deposit', label: 'Wrap 0.001 ETH' },
    { id: 'weth-approve', label: 'Approve WETH (0.001)' },
    { id: 'weth-transfer', label: 'Transfer 0.001 WETH to self' },
    { id: 'weth-withdraw', label: 'Unwrap 0.001 WETH' },
  ],
  5: [
    { id: 'weth-deposit', label: 'Wrap 0.001 ETH' },
    { id: 'weth-approve', label: 'Approve WETH (0.001)' },
    { id: 'weth-transfer', label: 'Transfer 0.001 WETH to self' },
    { id: 'weth-revoke', label: 'Revoke WETH approval' },
    { id: 'weth-withdraw', label: 'Unwrap 0.001 WETH' },
  ],
}

const buildMockStepDefs = (count: number): FlowStep[] => {
  const safe = Math.max(1, Math.min(5, count))
  const catalog = stepCatalog[safe] ?? stepCatalog[1]
  return catalog.map((meta) => ({
    id: meta.id,
    label: meta.label,
    type: 'tx',
  } as FlowStep))
}

const mockActions: FlowActions = {
  start: noop,
  confirm: noop,
  cancel: noop,
  retry: noop,
  retryFrom: noop,
  forceSubmit: noop,
  reset: noop,
  skipStep: noop,
}

type MockFlowShape = {
  status: FlowStatus
  currentStepIndex: number
  step0: StepStatus
  step1: StepStatus
}

const activeStepStates: readonly string[] = [
  'simulating',
  'confirming-risk',
  'simulation-failed',
  'signing',
  'tx-pending',
  'waiting',
  'error',
  'rejected',
  'canceled',
]

const stateMap: Record<string, MockFlowShape> = {
  'pending': { status: 'idle', currentStepIndex: 0, step0: 'pending', step1: 'pending' },
  'simulating': { status: 'running', currentStepIndex: 0, step0: 'simulating', step1: 'pending' },
  'confirming-risk': { status: 'running', currentStepIndex: 0, step0: 'confirming-risk', step1: 'pending' },
  'simulation-failed': { status: 'error', currentStepIndex: 0, step0: 'simulation-failed', step1: 'canceled' },
  'signing': { status: 'running', currentStepIndex: 0, step0: 'signing', step1: 'pending' },
  'tx-pending': { status: 'running', currentStepIndex: 0, step0: 'tx-pending', step1: 'pending' },
  'waiting': { status: 'running', currentStepIndex: 0, step0: 'waiting', step1: 'pending' },
  'completed': { status: 'completed', currentStepIndex: 1, step0: 'completed', step1: 'completed' },
  'skipped': { status: 'running', currentStepIndex: 2, step0: 'completed', step1: 'skipped' },
  'error': { status: 'error', currentStepIndex: 0, step0: 'error', step1: 'canceled' },
  'rejected': { status: 'rejected', currentStepIndex: 0, step0: 'rejected', step1: 'canceled' },
  'canceled': { status: 'canceled', currentStepIndex: 0, step0: 'canceled', step1: 'canceled' },
}

const trailingStatusFor = (flowStatus: FlowStatus): StepStatus => {
  if (flowStatus === 'completed') {return 'completed'}
  // Real cascade-cancel behaviour: any failure/cancel propagates 'canceled'
  // down to all subsequent steps (per CLAUDE.md "Cascade cancel").
  if (flowStatus === 'error' || flowStatus === 'rejected' || flowStatus === 'canceled') {return 'canceled'}
  return 'pending'
}

type BuildInput = {
  activeState: string
  stepsCount: number
  warnMaxApproval: boolean
}

const buildSkippedFlow = (catalog: readonly StepMeta[], stepsCount: number): FlowState => {
  const steps: StepState[] = catalog.map((meta, index) => {
    let status: StepStatus = 'pending'
    if (index === 0) {
      status = 'completed'
    }
    else if (index === 1) {
      status = 'skipped'
    }
    else if (index === 2) {
      status = 'signing'
    }
    return { id: meta.id, status, confirmCountdown: 0 }
  })
  return { status: 'running', currentStepIndex: 2, totalSteps: stepsCount, steps }
}

const buildMockFlowState = (input: BuildInput): FlowState => {
  const shape = stateMap[input.activeState] ?? stateMap.pending
  const trailing = trailingStatusFor(shape.status)
  const safe = Math.max(1, Math.min(5, input.stepsCount))
  const catalog = stepCatalog[safe] ?? stepCatalog[1]

  // Skipped is only meaningful mid-flow with >= 3 steps. Otherwise fall through
  // to the regular shape (step 0 carries the skipped status, flow completed).
  if (input.activeState === 'skipped' && safe >= 3) {
    return buildSkippedFlow(catalog, input.stepsCount)
  }

  const approveIndex = catalog.findIndex((meta) => meta.id === 'weth-approve')
  const pivot = input.warnMaxApproval
    && approveIndex >= 0
    && activeStepStates.includes(input.activeState)
  const activeIndex = pivot ? approveIndex : shape.currentStepIndex
  const baseStep1: StepStatus = input.stepsCount > 1 ? shape.step1 : trailing

  const steps: StepState[] = catalog.map((meta, index) => {
    if (pivot) {
      if (index < approveIndex) {
        return { id: meta.id, status: 'completed', confirmCountdown: 0 }
      }
      if (index === approveIndex) {
        return { id: meta.id, status: shape.step0, confirmCountdown: 0 }
      }
      return { id: meta.id, status: trailing, confirmCountdown: 0 }
    }
    if (index === 0) {
      return { id: meta.id, status: shape.step0, confirmCountdown: 0 }
    }
    if (index === 1) {
      return { id: meta.id, status: baseStep1, confirmCountdown: 0 }
    }
    return { id: meta.id, status: trailing, confirmCountdown: 0 }
  })

  // Attach a mock error object so FlowToast renders a meaningful message
  if (shape.status === 'error') {
    const erroredIndex = steps.findIndex((s) => s.status === 'error' || s.status === 'simulation-failed')
    if (erroredIndex >= 0) {
      steps[erroredIndex] = {
        ...steps[erroredIndex],
        error: {
          code: 'EXECUTION_REVERTED',
          message: 'Transaction failed: insufficient gas',
        },
      }
    }
  }

  return {
    status: shape.status,
    currentStepIndex: activeIndex,
    totalSteps: input.stepsCount,
    steps,
  }
}

type UseMockFlowInput = {
  activeState: string
  stepsCount?: number
  warnMaxApproval?: boolean
  flowId?: string
  /** Bump to force re-inject the flow entry even if other inputs are unchanged.
   *  Needed for trigger-style demos (FlowToast Examples) where the same terminal
   *  status must re-fire so a dismissed toast can re-appear on the next click. */
  version?: number
}

const useMockFlow = (input: UseMockFlowInput) => {
  const store = useFlowStore()
  const { activeState, stepsCount = 2, warnMaxApproval = false, flowId = DEFAULT_FLOW_ID, version = 0 } = input

  useEffect(() => {
    if (!store) {return}

    const flow = buildMockFlowState({ activeState, stepsCount, warnMaxApproval })
    const stepDefs = buildMockStepDefs(stepsCount)
    setFlowEntry({
      store,
      flowId,
      entry: {
        flow,
        steps: stepDefs,
        actions: mockActions,
      },
    })
    notifyFlowListeners(store)

    return () => {
      store.entries.delete(flowId)
      store.version++
      notifyFlowListeners(store)
    }
  }, [ store, activeState, stepsCount, warnMaxApproval, flowId, version ])
}


export default useMockFlow
