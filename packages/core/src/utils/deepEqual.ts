const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/** Deep equality comparison for plain objects and arrays */
export const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) {
    return true
  }
  if (typeof a !== typeof b) {
    return false
  }

  if (isRecord(a) && isRecord(b)) {
    if (Array.isArray(a) !== Array.isArray(b)) {
      return false
    }

    const aKeys = Object.keys(a)
    const bKeys = Object.keys(b)

    if (aKeys.length !== bKeys.length) {
      return false
    }

    return aKeys.every((key) => deepEqual(a[key], b[key]))
  }

  return false
}
