import { useState, useEffect, useRef, useMemo, type RefObject } from 'react'


export type UseActiveBrowserTabReturn = {
  /** Whether the browser tab is currently visible */
  isActive: boolean
  /** Ref for imperative access (avoids stale closures in callbacks) */
  isActiveRef: RefObject<boolean>
}

const useActiveBrowserTab = (): UseActiveBrowserTabReturn => {
  const [ isActive, setActive ] = useState(true)
  const isActiveRef = useRef(isActive)
  isActiveRef.current = isActive

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const handleVisibilityChange = () => {
      setActive(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return useMemo(() => ({
    isActive,
    isActiveRef,
  }), [ isActive ])
}


export default useActiveBrowserTab
