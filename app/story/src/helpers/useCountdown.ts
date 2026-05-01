import { useEffect, useState } from 'react'


type Input = {
  durationMs: number
  isActive: boolean
}

type Output = {
  remainingMs: number
  isExpired: boolean
}

const useCountdown = ({ durationMs, isActive }: Input): Output => {
  const [ remainingMs, setRemainingMs ] = useState(isActive ? durationMs : 0)

  useEffect(() => {
    if (!isActive || durationMs <= 0) {
      setRemainingMs(0)
      return
    }

    setRemainingMs(durationMs)
    const startedAt = Date.now()

    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt
      const remaining = Math.max(0, durationMs - elapsed)
      setRemainingMs(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
      }
    }, 100)

    return () => {
      clearInterval(interval)
    }
  }, [ durationMs, isActive ])

  return {
    remainingMs,
    isExpired: remainingMs === 0,
  }
}


export default useCountdown
