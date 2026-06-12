import { useEffect, useLayoutEffect } from 'react'


/**
 * useLayoutEffect on the client, useEffect during SSR - Next renders client
 * components on the server too, where useLayoutEffect warns and never runs.
 * Used for scroll positioning and storage-restore that must land before the
 * browser paints, so a restored chat appears in its final state with no
 * visible jump.
 */
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect
