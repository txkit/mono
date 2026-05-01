/**
 * Safe localStorage wrapper with SSR guard, feature detection,
 * and in-memory fallback.
 *
 * Handles: SSR, incognito mode quota errors, disabled cookies,
 * SecurityError in sandboxed iframes, Firefox storage corruption.
 *
 * Pattern validated against frontwise/StakeWise LocalStorage class.
 */

const memoryStore = new Map<string, string>()

const isAvailable = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    const testKey = '__txkit_storage_test__'
    window.localStorage.setItem(testKey, '1')
    window.localStorage.removeItem(testKey)
    return true
  }
  catch {
    return false
  }
}

// Cache the check - storage availability won't change during session
let available: boolean | null = null

const checkAvailable = (): boolean => {
  if (available === null) {
    available = isAvailable()
  }
  return available
}

const safeStorage = {
  getItem(key: string): string | null {
    if (!checkAvailable()) {
      return memoryStore.get(key) ?? null
    }

    try {
      return window.localStorage.getItem(key)
    }
    catch {
      // Firefox NS_ERROR_FILE_CORRUPTED or similar - fall back to memory
      return memoryStore.get(key) ?? null
    }
  },

  setItem(key: string, value: string): void {
    if (!checkAvailable()) {
      memoryStore.set(key, value)
      return
    }

    try {
      window.localStorage.setItem(key, value)
    }
    catch {
      // Quota exceeded or corruption - save to memory as fallback
      memoryStore.set(key, value)
    }
  },

  removeItem(key: string): void {
    memoryStore.delete(key)

    if (!checkAvailable()) {
      return
    }

    try {
      window.localStorage.removeItem(key)
    }
    catch {
    }
  },
}


export default safeStorage
