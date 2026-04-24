import React, { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'


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

const StateVisualizer: React.FC<StateVisualizerProps> = ({
  states = DEFAULT_STATES,
  currentState = 'idle',
  onStateClick,
}) => {
  const activeIndex = states.findIndex((st) => st.id === currentState)
  const [ emblaRef, emblaApi ] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  })
  const [ canPrev, setCanPrev ] = useState(false)
  const [ canNext, setCanNext ] = useState(false)

  const updateButtonState = useCallback(() => {
    if (!emblaApi) {
      return
    }
    setCanPrev(emblaApi.canScrollPrev())
    setCanNext(emblaApi.canScrollNext())
  }, [ emblaApi ])

  useEffect(() => {
    if (!emblaApi) {
      return
    }
    updateButtonState()
    emblaApi.on('select', updateButtonState)
    emblaApi.on('reInit', updateButtonState)
    return () => {
      emblaApi.off('select', updateButtonState)
      emblaApi.off('reInit', updateButtonState)
    }
  }, [ emblaApi, updateButtonState ])

  useEffect(() => {
    if (!emblaApi || activeIndex < 0) {
      return
    }
    emblaApi.scrollTo(activeIndex, prefersReducedMotion())
  }, [ emblaApi, activeIndex ])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [ emblaApi ])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [ emblaApi ])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!emblaApi) {
      return
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      emblaApi.scrollPrev()
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      emblaApi.scrollNext()
    } else if (event.key === 'Home') {
      event.preventDefault()
      emblaApi.scrollTo(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      emblaApi.scrollTo(states.length - 1)
    }
  }

  return (
    <div
      className="state-visualizer"
      role="tablist"
      aria-label="Transaction state flow"
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="state-viz-arrow state-viz-arrow--prev"
        disabled={!canPrev}
        onClick={scrollPrev}
        aria-label="Previous state"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <div className="state-viz-embla" ref={emblaRef}>
        <div className="state-viz-track">
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
                <button
                  key={state.id}
                  type="button"
                  className={nodeClasses}
                  style={{ '--state-color': state.color } as React.CSSProperties}
                  role="tab"
                  aria-selected={isActive}
                  aria-current={isActive ? 'step' : undefined}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => onStateClick?.(state.id)}
                >
                  <span
                    className="state-dot"
                    style={{ background: isActive || isPast ? state.color : undefined }}
                  />
                  <span className="state-label">{state.label}</span>
                </button>
              )
            })
          }
        </div>
      </div>
      <button
        type="button"
        className="state-viz-arrow state-viz-arrow--next"
        disabled={!canNext}
        onClick={scrollNext}
        aria-label="Next state"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  )
}


export default StateVisualizer
