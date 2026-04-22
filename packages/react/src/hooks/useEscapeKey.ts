import { useEffect } from 'react'


const useEscapeKey = (handler: () => void, enabled = true) => {
  useEffect(() => {
    if (!enabled) {
      return
    }

    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handler()
      }
    }

    document.addEventListener('keydown', listener)
    return () => document.removeEventListener('keydown', listener)
  }, [ handler, enabled ])
}


export default useEscapeKey
