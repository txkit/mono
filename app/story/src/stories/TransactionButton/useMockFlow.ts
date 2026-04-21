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

const mockStepDefs: FlowStep[] = [
  { id: 'approve', label: 'Approve USDC', type: 'tx' } as FlowStep,
  { id: 'transfer', label: 'Transfer USDC', type: 'tx' } as FlowStep,
]

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

const stateMap: Record<string, MockFlowShape> = {
  'pending': { status: 'idle', currentStepIndex: 0, step0: 'pending', step1: 'pending' },
  'simulating': { status: 'running', currentStepIndex: 0, step0: 'simulating', step1: 'pending' },
  'confirming-risk': { status: 'running', currentStepIndex: 0, step0: 'confirming-risk', step1: 'pending' },
  'simulation-failed': { status: 'error', currentStepIndex: 0, step0: 'simulation-failed', step1: 'canceled' },
  'signing': { status: 'running', currentStepIndex: 0, step0: 'signing', step1: 'pending' },
  'tx-pending': { status: 'running', currentStepIndex: 0, step0: 'tx-pending', step1: 'pending' },
  'waiting': { status: 'running', currentStepIndex: 0, step0: 'waiting', step1: 'pending' },
  'completed': { status: 'completed', currentStepIndex: 1, step0: 'completed', step1: 'completed' },
  'skipped': { status: 'completed', currentStepIndex: 1, step0: 'skipped', step1: 'completed' },
  'error': { status: 'error', currentStepIndex: 0, step0: 'error', step1: 'canceled' },
  'rejected': { status: 'rejected', currentStepIndex: 0, step0: 'rejected', step1: 'canceled' },
  'canceled': { status: 'error', currentStepIndex: 0, step0: 'canceled', step1: 'canceled' },
}

const buildMockFlowState = (activeState: string): FlowState => {
  const shape = stateMap[activeState] ?? stateMap.pending

  const steps: StepState[] = [
    { id: 'approve', status: shape.step0, confirmCountdown: 0 },
    { id: 'transfer', status: shape.step1, confirmCountdown: 0 },
  ]

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
    currentStepIndex: shape.currentStepIndex,
    totalSteps: 2,
    steps,
  }
}

const useMockFlow = (activeState: string, flowId: string = DEFAULT_FLOW_ID) => {
  const store = useFlowStore()

  useEffect(() => {
    if (!store) return

    const flow = buildMockFlowState(activeState)
    setFlowEntry(store, flowId, {
      flow,
      steps: mockStepDefs,
      actions: mockActions,
    })
    notifyFlowListeners(store)

    return () => {
      store.entries.delete(flowId)
      store.version++
      notifyFlowListeners(store)
    }
  }, [ store, activeState, flowId ])
}


export default useMockFlow
