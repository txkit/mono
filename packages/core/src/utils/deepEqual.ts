/** Deep equality comparison for plain objects and arrays */
export const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) {
    return true
  }
  if (a === null || b === null) {
    return false
  }
  if (typeof a !== typeof b) {
    return false
  }

  if (typeof a === 'object') {
    const aObj = a as Record<string, unknown>
    const bObj = b as Record<string, unknown>

    if (Array.isArray(aObj) !== Array.isArray(bObj)) {
      return false
    }

    const aKeys = Object.keys(aObj)
    const bKeys = Object.keys(bObj)

    if (aKeys.length !== bKeys.length) {
      return false
    }

    return aKeys.every((key) => deepEqual(aObj[key], bObj[key]))
  }

  return false
}
