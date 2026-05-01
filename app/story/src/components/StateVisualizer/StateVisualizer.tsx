import React, { useCallback, useEffect, useRef, useState } from 'react'


type StateNode = {
  id: string
  label: string
  color: string
}

const DEFAULT_STATES: readonly StateNode[] = [
  { id: 'pending', label: 'Pending', color: '#64748b' },
  { id: 'simulating', label: 'Simulating', color: '#f59e0b' },
  { id: 'confirming-risk', label: 'Confirming', color: '#f59e0b' },
  { id: 'simulation-failed', label: 'Sim Failed', color: '#ef4444' },
  { id: 'signing', label: 'Signing', color: '#3b82f6' },
  { id: 'tx-pending', label: 'Tx Pending', color: '#3b82f6' },
  { id: 'waiting', label: 'Waiting', color: '#8b5cf6' },
  { id: 'completed', label: 'Completed', color: '#10b981' },
  { id: 'skipped', label: 'Skipped', color: '#94a3b8' },
  { id: 'error', label: 'Error', color: '#ef4444' },
  { id: 'rejected', label: 'Rejected', color: '#f97316' },
  { id: 'canceled', label: 'Canceled', color: '#6b7280' },
]

type StateVisualizerProps = {
  states?: readonly StateNode[]
  currentState?: string
  onStateClick?: (stateId: string) => void
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const SMOOTH_DURATION_MS = 280

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

const StateVisualizer: React.FC<StateVisualizerProps> = ({
  states = DEFAULT_STATES,
  currentState = 'idle',
  onStateClick,
}) => {
  const activeIndex = states.findIndex((st) => st.id === currentState)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLOListElement>(null)
  const rafRef = useRef<number | null>(null)
  const didInitialCenterRef = useRef(false)
  const [ canPrev, setCanPrev ] = useState(false)
  const [ canNext, setCanNext ] = useState(false)
  const [ ready, setReady ] = useState(false)

  const updateCanScroll = useCallback(() => {
    const vp = viewportRef.current
    if (!vp) {
      return
    }
    setCanPrev(vp.scrollLeft > 1)
    setCanNext(vp.scrollLeft < vp.scrollWidth - vp.clientWidth - 1)
  }, [])

  // rAF-driven scroll. Direct `scrollLeft = x` is instant, and
  // `scrollTo({ behavior: 'smooth' })` silently no-ops in some Chromium
  // states (observed after rapid state changes inside the mask/embla
  // wrappers). Lerping scrollLeft ourselves is reliable across browsers.
  const smoothScrollTo = useCallback((target: number) => {
    const vp = viewportRef.current
    if (!vp) {
      return
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    const clamped = Math.max(0, Math.min(target, vp.scrollWidth - vp.clientWidth))
    if (prefersReducedMotion()) {
      vp.scrollLeft = clamped
      return
    }
    const start = vp.scrollLeft
    const delta = clamped - start
    if (Math.abs(delta) < 0.5) {
      vp.scrollLeft = clamped
      return
    }
    const startTime = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / SMOOTH_DURATION_MS)
      vp.scrollLeft = start + delta * easeInOutCubic(t)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        rafRef.current = null
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }, [])

  // Give the first/last items enough inline padding that they can still
  // land in the viewport's horizontal center. Without this, clamping at
  // scrollLeft=0 or scrollLeft=max leaves edge pills flush with a side.
  const syncEdgePadding = useCallback(() => {
    const vp = viewportRef.current
    const track = trackRef.current
    if (!vp || !track) {
      return
    }
    const first = track.firstElementChild as HTMLElement | null
    const last = track.lastElementChild as HTMLElement | null
    if (!first || !last) {
      return
    }
    const halfViewport = vp.clientWidth / 2
    const startPad = Math.max(0, halfViewport - first.offsetWidth / 2)
    const endPad = Math.max(0, halfViewport - last.offsetWidth / 2)
    track.style.paddingInlineStart = `${startPad}px`
    track.style.paddingInlineEnd = `${endPad}px`
  }, [])

  // Bind scroll + resize listeners, keep edge padding in sync with size.
  useEffect(() => {
    const vp = viewportRef.current
    const track = trackRef.current
    if (!vp || !track) {
      return
    }
    syncEdgePadding()
    updateCanScroll()
    vp.addEventListener('scroll', updateCanScroll, { passive: true })
    const ro = new ResizeObserver(() => {
      syncEdgePadding()
      updateCanScroll()
    })
    ro.observe(vp)
    const first = track.firstElementChild
    const last = track.lastElementChild
    if (first) {
      ro.observe(first)
    }
    if (last && last !== first) {
      ro.observe(last)
    }
    return () => {
      vp.removeEventListener('scroll', updateCanScroll)
      ro.disconnect()
    }
  }, [ updateCanScroll, syncEdgePadding, states.length ])

  // Center active pill on change. Query by activeIndex rather than a
  // React ref - ref binding via `ref={isActive ? ref : undefined}` is
  // racy because refs get detached from the previous active before the
  // new one attaches, and the effect can fire in between.
  useEffect(() => {
    if (activeIndex < 0) {
      setReady(true)
      return
    }
    // 50ms delay waits past MockPreview's useMockFlow setState + any
    // other effect cascades that can fire right after clicking a pill
    // and re-trigger renders, which in turn reset scrollLeft to 0.
    const timeout = setTimeout(() => {
      const vp = viewportRef.current
      if (!vp) {
        return
      }
      const activeEl = vp.querySelectorAll<HTMLElement>('.state-viz-item')[activeIndex]
      if (!activeEl) {
        return
      }
      // Compute target via getBoundingClientRect instead of offsetLeft:
      // offsetLeft is relative to .state-visualizer (the nearest
      // positioned ancestor), which sits inside the arrow/gap padding,
      // so using it directly skews the target by vp.offsetLeft (~36px).
      const vpRect = vp.getBoundingClientRect()
      const activeRect = activeEl.getBoundingClientRect()
      const currentOffset = activeRect.left - vpRect.left
      const desiredOffset = (vpRect.width - activeRect.width) / 2
      const target = vp.scrollLeft + currentOffset - desiredOffset
      const clamped = Math.max(0, Math.min(target, vp.scrollWidth - vp.clientWidth))
      // First centering after mount is instant - avoids a visible
      // "offset -> animated recenter" flicker when the page first paints
      // or the user switches stories. Subsequent activeIndex changes
      // animate via rAF.
      if (!didInitialCenterRef.current) {
        didInitialCenterRef.current = true
        vp.scrollLeft = clamped
        setReady(true)
        return
      }
      smoothScrollTo(clamped)
    }, 50)
    return () => clearTimeout(timeout)
  }, [ activeIndex, smoothScrollTo ])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  // Center a specific pill index inside the viewport. Shared between the
  // active-state effect and arrow buttons so they all use one math path.
  const centerIndex = useCallback((index: number) => {
    const vp = viewportRef.current
    if (!vp) {
      return
    }
    const target = vp.querySelectorAll<HTMLElement>('.state-viz-item')[index]
    if (!target) {
      return
    }
    const vpRect = vp.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const currentOffset = targetRect.left - vpRect.left
    const desiredOffset = (vpRect.width - targetRect.width) / 2
    const scrollTarget = vp.scrollLeft + currentOffset - desiredOffset
    smoothScrollTo(Math.max(0, Math.min(scrollTarget, vp.scrollWidth - vp.clientWidth)))
  }, [ smoothScrollTo ])

  // Find the pill whose horizontal center is closest to the viewport's
  // center. Used by arrow buttons to step relative to what the user
  // currently sees, not the (possibly off-screen) active state.
  const findCenteredIndex = (): number => {
    const vp = viewportRef.current
    if (!vp) {
      return -1
    }
    const items = vp.querySelectorAll<HTMLElement>('.state-viz-item')
    if (items.length === 0) {
      return -1
    }
    const vpRect = vp.getBoundingClientRect()
    const viewportCenter = vpRect.left + vpRect.width / 2
    let bestIndex = 0
    let bestDistance = Infinity
    items.forEach((item, index) => {
      const itemRect = item.getBoundingClientRect()
      const itemCenter = itemRect.left + itemRect.width / 2
      const distance = Math.abs(itemCenter - viewportCenter)
      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = index
      }
    })
    return bestIndex
  }

  const scrollPrev = () => {
    const current = findCenteredIndex()
    if (current > 0) {
      centerIndex(current - 1)
    }
  }
  const scrollNext = () => {
    const current = findCenteredIndex()
    if (current >= 0 && current < states.length - 1) {
      centerIndex(current + 1)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const vp = viewportRef.current
    if (!vp) {
      return
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      scrollPrev()
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      scrollNext()
    } else if (event.key === 'Home') {
      event.preventDefault()
      smoothScrollTo(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      smoothScrollTo(vp.scrollWidth)
    }
  }

  return (
    <div
      className="state-visualizer"
      role="group"
      aria-label="Transaction state flow"
      data-ready={ready ? '' : undefined}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="state-viz-arrow state-viz-arrow--prev"
        disabled={!canPrev}
        onClick={scrollPrev}
        aria-label="Scroll to previous state"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <div
        className="state-viz-mask"
        data-can-prev={canPrev ? '' : undefined}
        data-can-next={canNext ? '' : undefined}
      >
      <div
        className="state-viz-embla"
        ref={viewportRef}
      >
        <ol className="state-viz-track" ref={trackRef}>
          {
            states.map((state, index) => {
              const isActive = index === activeIndex
              const isPast = activeIndex >= 0 && index < activeIndex
              const isFuture = activeIndex >= 0 && index > activeIndex
              const isClickable = Boolean(onStateClick)
              const nodeClasses = [
                'state-node',
                isActive && 'active',
                isPast && 'past',
                isFuture && 'future',
                isClickable && 'clickable',
              ].filter(Boolean).join(' ')

              return (
                <li key={state.id} className="state-viz-item">
                  <button
                    type="button"
                    className={nodeClasses}
                    style={{ '--state-color': state.color } as React.CSSProperties}
                    aria-current={isActive ? 'step' : undefined}
                    aria-label={`State: ${state.label}${isActive ? ' (current)' : ''}`}
                    onClick={() => onStateClick?.(state.id)}
                  >
                    <span
                      className="state-dot"
                      style={{ background: isActive || isPast ? state.color : undefined }}
                    />
                    <span className="state-label">{state.label}</span>
                  </button>
                </li>
              )
            })
          }
        </ol>
      </div>
      </div>
      <button
        type="button"
        className="state-viz-arrow state-viz-arrow--next"
        disabled={!canNext}
        onClick={scrollNext}
        aria-label="Scroll to next state"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  )
}


export default StateVisualizer
