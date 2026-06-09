import type { CSSProperties } from 'react'


/** Build the inline style object that swaps an icon's color via CSS
 *  `currentColor`. The Webkit prefix is still required for older Safari
 *  (<= 17) and many in-app browsers, so we always emit both variants.
 *
 *  url() is SINGLE-quoted on purpose. Some bundlers (Next/turbopack consuming
 *  this package via transpilePackages) inline an `.svg` import as an unencoded
 *  data-URI whose SVG attributes use double quotes (`xmlns="..."`). Wrapping
 *  that in url("...") lets the first inner double quote close the string early,
 *  so the mask is dropped and the icon renders as a solid background-color
 *  square. Single quotes stay valid for base64 (tsup) and served-URL (vite)
 *  icon values too. Do NOT switch back to double quotes.
 *
 *  @example
 *    <span style={{ ...maskStyle(checkIcon), color: 'green' }} />
 */
export const maskStyle = (iconUrl: string): CSSProperties => ({
  maskImage: `url('${iconUrl}')`,
  WebkitMaskImage: `url('${iconUrl}')`,
})


export default maskStyle
