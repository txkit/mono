import { useState, useCallback } from 'react'


type SetStateAction<T> = Partial<T> | ((prevState: T) => Partial<T>)

/**
 * useState for objects with partial updates.
 * Supports both direct partial objects and functional updaters.
 *
 * @example
 * const [state, setState] = useObjectState({ count: 0, name: 'foo' })
 * setState({ count: 1 })                          // partial update
 * setState((prev) => ({ count: prev.count + 1 }))  // functional update
 */
const useObjectState = <T extends Record<string, unknown>>(
  initialState: T | (() => T)
): [T, (action: SetStateAction<T>) => void] => {
  const [ state, setStateRaw ] = useState<T>(initialState)

  const setState = useCallback((action: SetStateAction<T>) => {
    setStateRaw((prev) => {
      const patch = typeof action === 'function' ? action(prev) : action
      return { ...prev, ...patch }
    })
  }, [])

  return [ state, setState ]
}


export default useObjectState
