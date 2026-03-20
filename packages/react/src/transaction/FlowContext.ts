import { createContext, useContext, useRef, useSyncExternalStore, useCallback } from 'react'

import type { FlowState, FlowStep, FlowActions } from './flow-types'


// --- Flow Registry Entry ---

export type FlowEntry = {
  flow: FlowState
  steps: FlowStep[]
  actions: FlowActions
}

// --- External store (no React state, no re-render loops) ---

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

/** Write entry without notifying (used during render in useTransactionFlow) */
export const setFlowEntry = (store: FlowStore, flowId: string, entry: FlowEntry) => {
  store.entries.set(flowId, entry)
  store.version++
}

/** Notify all subscribers (used after render via useEffect) */
export const notifyFlowListeners = (store: FlowStore) => {
  store.listeners.forEach((listener) => listener())
}

// --- Context ---

export const FlowStoreContext = createContext<FlowStore | null>(null)

export const DEFAULT_FLOW_ID = '__default__'


// --- Public hooks ---

/** Read flow state by flowId. Re-renders when store is notified */
export const useFlowState = (flowId = DEFAULT_FLOW_ID): FlowEntry | undefined => {
  const store = useContext(FlowStoreContext)
  const versionRef = useRef(store?.version ?? 0)

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!store) {
        return () => {}
      }
      store.listeners.add(onStoreChange)
      return () => store.listeners.delete(onStoreChange)
    },
    [ store ],
  )

  const getSnapshot = useCallback(
    () => {
      if (!store) {
        return undefined
      }
      // Return new object ref only if version changed (prevents unnecessary re-renders)
      if (store.version !== versionRef.current) {
        versionRef.current = store.version
      }
      return store.entries.get(flowId)
    },
    [ store, flowId ],
  )

  return useSyncExternalStore(subscribe, getSnapshot, () => undefined)
}

/** Access flow store for registration */
export const useFlowStore = (): FlowStore | null => {
  return useContext(FlowStoreContext)
}
