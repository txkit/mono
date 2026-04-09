export type PollUntilOptions = {
  /** Polling interval in ms. @default 2000 */
  interval?: number
  /** Timeout in ms. 0 = no timeout. @default 120000 */
  timeout?: number
  /** AbortSignal for cancelation */
  signal?: AbortSignal
}

/** Poll a function until it returns a truthy value or timeout/abort */
export const pollUntil = async <T>(
  fn: () => T | Promise<T>,
  options?: PollUntilOptions
): Promise<NonNullable<T>> => {
  const interval = options?.interval ?? 2000
  const timeout = options?.timeout ?? 120_000
  const start = Date.now()

  while (true) {
    if (options?.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }

    const result = await fn()

    if (result != null) {
      return result
    }

    if (timeout > 0 && Date.now() - start >= timeout) {
      throw new Error('pollUntil timeout')
    }

    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, interval)

      // If signal aborts during sleep, resolve immediately
      if (options?.signal) {
        const onAbort = () => {
          clearTimeout(timer)
          resolve()
        }
        options.signal.addEventListener('abort', onAbort, { once: true })
      }
    })
  }
}
