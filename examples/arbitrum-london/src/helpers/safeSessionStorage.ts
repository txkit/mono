/**
 * sessionStorage with an in-memory fallback (frontwise pattern). Storage
 * access can throw outright - embedded iframes with blocked cookies, some
 * private modes - and a chat that cannot persist must degrade to per-view
 * state (losing only restore-on-reload), never crash the tree. Call sites
 * use this instead of window.sessionStorage and skip their own try/catch.
 *
 * Client-only by construction: every consumer runs inside an effect or an
 * event handler, so the probe never executes during SSR.
 */

const memoryStore = new Map<string, string>()

// Probed lazily on first use and remembered for the session.
let isStorageUsable: boolean | null = null

const checkIsUsable = (): boolean => {
  if (isStorageUsable !== null) {
    return isStorageUsable
  }

  try {
    const probeKey = 'txkit-storage-probe'
    window.sessionStorage.setItem(probeKey, '1')
    window.sessionStorage.removeItem(probeKey)
    isStorageUsable = true
  } catch {
    isStorageUsable = false
  }

  return isStorageUsable
}

export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (!checkIsUsable()) {
      return memoryStore.get(key) ?? null
    }

    return window.sessionStorage.getItem(key)
  },

  setItem: (key: string, value: string): void => {
    if (!checkIsUsable()) {
      memoryStore.set(key, value)
      return
    }

    try {
      window.sessionStorage.setItem(key, value)
    } catch {
      // Quota filled mid-session: keep the value for this view at least.
      memoryStore.set(key, value)
    }
  },

  removeItem: (key: string): void => {
    if (!checkIsUsable()) {
      memoryStore.delete(key)
      return
    }

    window.sessionStorage.removeItem(key)
  },
}
