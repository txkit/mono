import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { pollUntil } from './polling'


describe('pollUntil', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the first non-null value', async () => {
    let calls = 0
    const promise = pollUntil(() => {
      calls += 1
      return calls < 3 ? null : 'ready'
    }, { interval: 100, timeout: 0 })

    await vi.advanceTimersByTimeAsync(300)
    await expect(promise).resolves.toBe('ready')
    expect(calls).toBe(3)
  })

  it('returns the first non-undefined value', async () => {
    let calls = 0
    const promise = pollUntil(() => {
      calls += 1
      return calls < 2 ? undefined : 42
    }, { interval: 50, timeout: 0 })

    await vi.advanceTimersByTimeAsync(100)
    await expect(promise).resolves.toBe(42)
  })

  it('returns 0 (falsy but non-null) immediately', async () => {
    const promise = pollUntil(() => 0 as unknown as number | null, {
      interval: 100,
      timeout: 0,
    })
    await expect(promise).resolves.toBe(0)
  })

  it('returns the result of an async function', async () => {
    const promise = pollUntil(async () => 'async-ready', { interval: 50, timeout: 0 })
    await expect(promise).resolves.toBe('async-ready')
  })

  it('throws timeout when fn keeps returning null past the deadline', async () => {
    const promise = pollUntil(() => null, { interval: 100, timeout: 250 })
    promise.catch(() => undefined)

    await vi.advanceTimersByTimeAsync(400)
    await expect(promise).rejects.toThrow('pollUntil timeout')
  })

  it('rejects with AbortError when the signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(pollUntil(() => null, { signal: controller.signal })).rejects.toThrow('Aborted')
  })

  it('rejects with AbortError when the signal aborts during sleep', async () => {
    const controller = new AbortController()
    const promise = pollUntil(() => null, {
      interval: 1000,
      timeout: 0,
      signal: controller.signal,
    })
    promise.catch(() => undefined)

    await vi.advanceTimersByTimeAsync(100)
    controller.abort()
    await vi.advanceTimersByTimeAsync(0)

    await expect(promise).rejects.toThrow('Aborted')
  })

  it('does not leak abort listeners across iterations', async () => {
    const controller = new AbortController()
    const addSpy = vi.spyOn(controller.signal, 'addEventListener')
    const removeSpy = vi.spyOn(controller.signal, 'removeEventListener')

    const promise = pollUntil(() => null, {
      interval: 50,
      timeout: 200,
      signal: controller.signal,
    })
    promise.catch(() => undefined)

    await vi.advanceTimersByTimeAsync(300)

    expect(addSpy).toHaveBeenCalled()
    // Each registered listener must be cleaned up on its own slot
    expect(removeSpy.mock.calls.length).toBe(addSpy.mock.calls.length)
  })

  it('uses 0 timeout to mean unbounded polling', async () => {
    let calls = 0
    const promise = pollUntil(() => {
      calls += 1
      return calls === 50 ? 'eventually' : null
    }, { interval: 10, timeout: 0 })

    await vi.advanceTimersByTimeAsync(500)
    await expect(promise).resolves.toBe('eventually')
  })
})
