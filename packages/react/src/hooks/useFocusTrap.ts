import { useEffect, type RefObject } from 'react'


const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

const useFocusTrap = (ref: RefObject<HTMLElement | null>, isActive: boolean) => {
  useEffect(() => {
    if (!isActive || !ref.current) {
      return
    }

    const container = ref.current
    const initialElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    initialElements[0]?.focus()

    const listener = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return
      }

      // Query on each Tab press to handle dynamic content
      const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (!elements.length) {
        event.preventDefault()
        return
      }

      const first = elements[0]
      const last = elements[elements.length - 1]

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    container.addEventListener('keydown', listener)
    return () => container.removeEventListener('keydown', listener)
  }, [ ref, isActive ])
}


export default useFocusTrap
