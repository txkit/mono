import { useState, useCallback, useEffect, useRef } from 'react'


export type UseArrowNavigationOptions = {
  /** Total number of navigable items */
  itemCount: number
  /** Called when an item is activated (Enter/Space) */
  onActivate?: (index: number) => void
  /** Enable type-ahead search by character keys */
  typeAhead?: boolean
  /** Get label for item at index (for type-ahead) */
  getLabel?: (index: number) => string
  /** Orientation: vertical (default) or horizontal */
  orientation?: 'vertical' | 'horizontal'
}

export type UseArrowNavigationReturn = {
  /** Currently focused item index */
  activeIndex: number
  /** Set active index manually */
  setActiveIndex: (index: number) => void
  /** Attach to the container element's onKeyDown */
  handleKeyDown: (event: React.KeyboardEvent) => void
  /** Get tabIndex for item at index (roving tabindex pattern) */
  getTabIndex: (index: number) => 0 | -1
}

const TYPE_AHEAD_RESET_MS = 500

const useArrowNavigation = (options: UseArrowNavigationOptions): UseArrowNavigationReturn => {
  const {
    itemCount,
    onActivate,
    typeAhead = false,
    getLabel,
    orientation = 'vertical',
  } = options

  const [ activeIndex, setActiveIndex ] = useState(0)
  const typeBufferRef = useRef('')
  const typeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Reset active index when item count changes
  useEffect(() => {
    if (activeIndex >= itemCount && itemCount > 0) {
      setActiveIndex(itemCount - 1)
    }
  }, [ itemCount, activeIndex ])

  const handleTypeAhead = useCallback((char: string) => {
    if (!typeAhead || !getLabel) {
      return
    }

    clearTimeout(typeTimerRef.current)
    typeBufferRef.current += char.toLowerCase()

    const buffer = typeBufferRef.current

    for (let index = 0; index < itemCount; index++) {
      const label = getLabel(index).toLowerCase()
      if (label.startsWith(buffer)) {
        setActiveIndex(index)
        break
      }
    }

    typeTimerRef.current = setTimeout(() => {
      typeBufferRef.current = ''
    }, TYPE_AHEAD_RESET_MS)
  }, [ typeAhead, getLabel, itemCount ])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft'
    const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight'

    switch (event.key) {
      case nextKey:
        event.preventDefault()
        setActiveIndex((prev) => Math.min(prev + 1, itemCount - 1))
        break
      case prevKey:
        event.preventDefault()
        setActiveIndex((prev) => Math.max(prev - 1, 0))
        break
      case 'Home':
        event.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        event.preventDefault()
        setActiveIndex(itemCount - 1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        onActivate?.(activeIndex)
        break
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
          handleTypeAhead(event.key)
        }
    }
  }, [ activeIndex, itemCount, onActivate, orientation, handleTypeAhead ])

  const getTabIndex = useCallback(
    (index: number): 0 | -1 => index === activeIndex ? 0 : -1,
    [ activeIndex ],
  )

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
    getTabIndex,
  }
}


export default useArrowNavigation
