/** Module-level registry of visible FlowToast instances per position.
 *
 *  Multiple FlowToast components mounted with the same `position` share a
 *  corner of the viewport. Without coordination they would overlap. Each
 *  FlowToast registers itself here while visible, reads its stack index, and
 *  applies a translate offset so the second / third / ... toast slot above
 *  (bottom-*) or below (top-*) the previous one. */

export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

type Stacks = Record<ToastPosition, string[]>

const stacks: Stacks = {
  'top-right': [],
  'top-left': [],
  'bottom-right': [],
  'bottom-left': [],
}

type Listener = () => void
const listeners: Set<Listener> = new Set()

const notify = () => {
  listeners.forEach((listener) => listener())
}


export const registerToast = (position: ToastPosition, flowId: string): void => {
  const list = stacks[position]
  if (!list.includes(flowId)) {
    list.push(flowId)
    notify()
  }
}

export const unregisterToast = (position: ToastPosition, flowId: string): void => {
  const list = stacks[position]
  const index = list.indexOf(flowId)
  if (index >= 0) {
    list.splice(index, 1)
    notify()
  }
}

export const subscribeToastStack = (listener: Listener): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const getStackIndex = (position: ToastPosition, flowId: string): number => {
  return stacks[position].indexOf(flowId)
}
