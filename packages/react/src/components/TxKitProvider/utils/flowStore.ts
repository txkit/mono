import type { FlowState, FlowStep, FlowActions } from '../../../types/transaction'


export type FlowEntry = {
  flow: FlowState
  steps: FlowStep[]
  actions: FlowActions
}

export type FlowStore = {
  entries: Map<string, FlowEntry>
  version: number
  listeners: Set<() => void>
}

export const createFlowStore = (): FlowStore => ({
  entries: new Map(),
  version: 0,
  listeners: new Set(),
})

export type SetFlowEntryInput = {
  flowId: string
  entry: FlowEntry
  store: FlowStore
}

/** Write entry without notifying (used during render in useTransactionFlow) */
export const setFlowEntry = ({ flowId, entry, store }: SetFlowEntryInput) => {
  store.entries.set(flowId, entry)
  store.version++
}

/** Notify all subscribers (used after render via useEffect) */
export const notifyFlowListeners = (store: FlowStore) => {
  store.listeners.forEach((listener) => listener())
}
