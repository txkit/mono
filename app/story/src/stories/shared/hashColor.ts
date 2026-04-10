/** Deterministic single-color HSL hash. */
const hashColor = (str: string): string => {
  let hash = 0
  for (let index = 0; index < str.length; index++) {
    hash = str.charCodeAt(index) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 55%, 45%)`
}

/**
 * Deterministic 2-color gradient from an Ethereum address.
 * Mirrors hashGradient in @txkit/react helpers - kept here so story
 * mocks can use the same visual without depending on the package internal.
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
