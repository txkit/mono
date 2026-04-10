/**
 * Deterministic HSL color from string hash (sdbm algorithm).
 * Used for simple single-color fallback (e.g. token icon).
 */
export const hashColor = (str: string): string => {
  let hash = 0
  for (let index = 0; index < str.length; index++) {
    hash = str.charCodeAt(index) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 55%, 45%)`
}

/**
 * Deterministic 2-color gradient from an Ethereum address.
 * Uses the first two bytes of the address to produce two distinct hues,
 * resulting in a premium, visually unique avatar for every wallet.
 *
 * @param address - 0x-prefixed hex address (or any hex string)
 * @returns CSS linear-gradient string ready for use as `background`
 *
 * @example
 *   <div style={{ background: hashGradient('0xd8dA6BF...') }} />
 *   //> linear-gradient(135deg, hsl(305, 70%, 60%), hsl(218, 70%, 50%))
 */
export const hashGradient = (address: string): string => {
  const hex = address.startsWith('0x') ? address.slice(2) : address
  const byte1 = parseInt(hex.slice(0, 2), 16) || 0
  const byte2 = parseInt(hex.slice(2, 4), 16) || 0
  const hue1 = Math.round((byte1 * 360) / 255)
  const hue2 = Math.round((byte2 * 360) / 255)
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 60%), hsl(${hue2}, 70%, 50%))`
}


export default hashColor
