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
 * Uses bytes 0 and 3 (not 0+1) so addresses with similar leading bytes
 * still produce visually distinct hues.
 */
export const hashGradient = (address: string): string => {
  const hex = address.startsWith('0x') ? address.slice(2) : address
  const byte1 = parseInt(hex.slice(0, 2), 16) || 0
  const byte2 = parseInt(hex.slice(6, 8), 16) || 0
  const hue1 = Math.round((byte1 * 360) / 255)
  const hue2 = Math.round((byte2 * 360) / 255)
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 60%), hsl(${hue2}, 70%, 50%))`
}

/** Deterministic 5x5 symmetric pixel pattern - mirrors hashPixelAvatar in @txkit/react. */
export type PixelAvatar = {
  pattern: boolean[][]
  background: string
  foreground: string
}

export const hashPixelAvatar = (address: string): PixelAvatar => {
  const hex = (address.startsWith('0x') ? address.slice(2) : address).padEnd(40, '0')
  const byte0 = parseInt(hex.slice(0, 2), 16) || 0
  const hue = Math.round((byte0 * 360) / 255)
  const hueAlt = (hue + 180) % 360

  const pattern: boolean[][] = []
  for (let row = 0; row < 5; row++) {
    const left: boolean[] = []
    for (let col = 0; col < 3; col++) {
      const nibble = parseInt(hex.charAt((row * 3 + col) % hex.length), 16) || 0
      left.push(nibble % 2 === 0)
    }
    pattern.push([ left[0], left[1], left[2], left[1], left[0] ])
  }

  return {
    pattern,
    foreground: `hsl(${hue}, 65%, 55%)`,
    background: `hsl(${hueAlt}, 30%, 92%)`,
  }
}


export default hashColor
