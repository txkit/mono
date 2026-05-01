import { useRef } from 'react'
import { deepEqual } from '@txkit/core'


const useDeepMemo = <T>(factory: () => T, deps: unknown[]): T => {
  const prevDepsRef = useRef<unknown[] | undefined>(undefined)
  const valueRef = useRef<T | undefined>(undefined)

  if (!prevDepsRef.current || !deepEqual(prevDepsRef.current, deps)) {
    valueRef.current = factory()
    prevDepsRef.current = deps
  }

  return valueRef.current as T
}


export default useDeepMemo
