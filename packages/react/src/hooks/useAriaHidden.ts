import { useEffect, type RefObject } from 'react'


const skipTags: Record<string, true> = {
  LINK: true,
  STYLE: true,
  SCRIPT: true,
}

/**
 * Sets `aria-hidden="true"` on body children that are siblings
 * of the portal container, hiding background content from screen readers
 * while a modal is open.
 *
 * Pattern used by Radix Dialog and React Aria. Safer than `inert`:
 * - Does not block pointer events (no broken notifications/toasts)
 * - Does not interfere with other libraries' modals
 * - Combined with focus trap (keyboard) and scroll lock, provides
 *   full modal isolation without touching elements we don't own
 *
 * Only hides siblings of the portal element in body. Elements already
 * hidden (aria-hidden="true") or non-content tags (script/style) are skipped.
 */
const useAriaHidden = (portalRef: RefObject<HTMLElement | null>) => {
  useEffect(() => {
    const portal = portalRef.current
    if (!portal) {
      return
    }

    // Find the top-level portal container (direct child of body)
    let portalRoot: HTMLElement | null = portal
    while (portalRoot && portalRoot.parentElement !== document.body) {
      portalRoot = portalRoot.parentElement
    }

    if (!portalRoot) {
      return
    }

    const hiddenElements: HTMLElement[] = []

    for (let index = 0; index < document.body.children.length; index++) {
      const element = document.body.children[index]
      if (!(element instanceof HTMLElement)) {
        continue
      }

      // Skip the portal container itself
      if (element === portalRoot) {
        continue
      }

      // Skip non-content elements
      if (skipTags[element.tagName]) {
        continue
      }

      // Skip elements already hidden
      if (element.getAttribute('aria-hidden') === 'true') {
        continue
      }

      element.setAttribute('aria-hidden', 'true')
      hiddenElements.push(element)
    }

    return () => {
      for (const element of hiddenElements) {
        element.removeAttribute('aria-hidden')
      }
    }
  }, [ portalRef ])
}


export default useAriaHidden
