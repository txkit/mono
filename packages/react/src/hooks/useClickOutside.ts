import { useEffect, type RefObject } from 'react'


const useClickOutside = (ref: RefObject<HTMLElement | null>, handler: () => void) => {
  useEffect(() => {
    const listener = (event: PointerEvent) => {
      if (!ref.current || !(event.target instanceof Node)) {
        return
      }
      if (ref.current.contains(event.target)) {
        return
      }
      handler()
    }

    // Capture-phase pointerdown (not bubble mousedown) so this still fires when the
    // outside target is a react-aria pressable: react-aria uses Pointer Events and
    // suppresses the legacy mousedown, and may stop propagation in the bubble phase.
    // This mirrors react-aria's own useInteractOutside, letting txKit and react-aria
    // overlays dismiss each other. pointerdown also covers mouse, touch, and pen.
    document.addEventListener('pointerdown', listener, true)

    return () => {
      document.removeEventListener('pointerdown', listener, true)
    }
  }, [ ref, handler ])
}


export default useClickOutside
