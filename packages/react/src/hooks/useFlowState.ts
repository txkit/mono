import { createContext, useContext, useSyncExternalStore, useCallback } from 'react'

import type { FlowStore, FlowEntry } from '../components/TxKitProvider/utils/flowStore'


export const FlowStoreContext = createContext<FlowStore | null>(null)

export const DEFAULT_FLOW_ID = '__default__'


/** Read flow state by flowId. Re-renders when store is notified */
export const useFlowState = (flowId = DEFAULT_FLOW_ID): FlowEntry | undefined => {
  const store = useContext(FlowStoreContext)

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
    () => store?.entries.get(flowId),
    [ store, flowId ],
  )

  return useSyncExternalStore(subscribe, getSnapshot, () => undefined)
}

/** Access flow store for registration */
export const useFlowStore = (): FlowStore | null => {
  return useContext(FlowStoreContext)
}
