import type { CSSProperties } from 'react'


/** Build the inline style object that swaps an icon's color via CSS
 *  `currentColor`. The Webkit prefix is still required for older Safari
 *  (<= 17) and many in-app browsers, so we always emit both variants.
 *
 *  @example
 *    <span style={{ ...maskStyle(checkIcon), color: 'green' }} />
 */
export const maskStyle = (iconUrl: string): CSSProperties => ({
  maskImage: `url("${iconUrl}")`,
  WebkitMaskImage: `url("${iconUrl}")`,
})


export default maskStyle
