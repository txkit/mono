import { useIsomorphicLayoutEffect } from '../useIsomorphicLayoutEffect'


// The envelope review Collapse animates grid-template-rows over 0.5s
// (globals.css .tx-collapse); pin slightly longer so the final frames land
// after the transition settles.
const PIN_DURATION_MS = 700

/**
 * While the envelope review expands below the freshly prepared turn, keeps
 * that turn pinned to the top of the chat scroll area so the review fills the
 * rest of the viewport. A single scrollIntoView at expand-start cannot get
 * there: the Collapse is still at 0fr, so the scroll height needed to bring
 * the card to the top does not exist yet, and the clamped scroll never
 * re-runs. Re-pinning every animation frame for the duration of the
 * transition makes the transcript follow the expansion - the card glides to
 * the top in sync with the envelope growing under it (instant per-frame
 * scrolls, so it also degrades to a single jump under reduced motion).
 *
 * `isInstant` (a review restored from storage): the Collapse mounts already
 * expanded, so one pin in the layout phase - before the browser paints -
 * lands the page directly in its final state with no visible motion.
 */
export const useReviewScrollPin = (isReviewOpen: boolean, isInstant: boolean) => {
  useIsomorphicLayoutEffect(() => {
    if (!isReviewOpen) {
      return
    }

    const card = document.querySelector('.tx-chat-scroll [data-status="prepared"]')
    if (card === null) {
      return
    }

    if (isInstant) {
      card.scrollIntoView({ block: 'start', behavior: 'instant' })
      return
    }

    let frameId = 0
    const startedAt = performance.now()

    const pin = (now: number) => {
      card.scrollIntoView({ block: 'start', behavior: 'instant' })
      if (now - startedAt < PIN_DURATION_MS) {
        frameId = requestAnimationFrame(pin)
      }
    }

    frameId = requestAnimationFrame(pin)

    return () => cancelAnimationFrame(frameId)
  }, [ isReviewOpen, isInstant ])
}
