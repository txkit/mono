import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import copyToClipboard from './copyToClipboard'


describe('copyToClipboard', () => {
  const originalNavigator = globalThis.navigator
  const originalDocument = globalThis.document

  beforeEach(() => {
    // Each test wires up its own navigator + document so the SSR guard
    // (typeof navigator === 'undefined') is exercised cleanly.
  })

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    })
    Object.defineProperty(globalThis, 'document', {
      value: originalDocument,
      configurable: true,
      writable: true,
    })
  })

  it('returns false when navigator is undefined (SSR / Node)', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: undefined,
      configurable: true,
      writable: true,
    })
    expect(await copyToClipboard('hello')).toBe(false)
  })

  it('returns false when document is undefined (SSR / Node)', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { clipboard: { writeText: async () => undefined } },
      configurable: true,
      writable: true,
    })
    Object.defineProperty(globalThis, 'document', {
      value: undefined,
      configurable: true,
      writable: true,
    })
    expect(await copyToClipboard('hello')).toBe(false)
  })

  it('uses the modern Clipboard API when available', async () => {
    const writeText = vi.fn(async () => undefined)
    Object.defineProperty(globalThis, 'navigator', {
      value: { clipboard: { writeText } },
      configurable: true,
      writable: true,
    })
    Object.defineProperty(globalThis, 'document', {
      value: { createElement: () => ({}), body: { appendChild: () => undefined, removeChild: () => undefined } },
      configurable: true,
      writable: true,
    })

    expect(await copyToClipboard('hello')).toBe(true)
    expect(writeText).toHaveBeenCalledWith('hello')
  })

  it('falls back to execCommand when the Clipboard API is missing', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { clipboard: undefined },
      configurable: true,
      writable: true,
    })
    const textarea: Record<string, unknown> = {
      style: {},
      setAttribute: vi.fn(),
      select: vi.fn(),
    }
    const createElement = vi.fn(() => textarea)
    const appendChild = vi.fn()
    const removeChild = vi.fn()
    const execCommand = vi.fn(() => true)
    Object.defineProperty(globalThis, 'document', {
      value: { createElement, body: { appendChild, removeChild }, execCommand },
      configurable: true,
      writable: true,
    })

    expect(await copyToClipboard('fallback')).toBe(true)
    expect(createElement).toHaveBeenCalledWith('textarea')
    expect(textarea.value).toBe('fallback')
    expect(textarea.setAttribute).toHaveBeenCalledWith('readonly', '')
    expect(appendChild).toHaveBeenCalledWith(textarea)
    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(removeChild).toHaveBeenCalledWith(textarea)
  })

  it('falls back to execCommand when the Clipboard API throws', async () => {
    const writeText = vi.fn(async () => {
      throw new Error('not allowed in iframe')
    })
    Object.defineProperty(globalThis, 'navigator', {
      value: { clipboard: { writeText } },
      configurable: true,
      writable: true,
    })
    const textarea: Record<string, unknown> = { style: {}, setAttribute: vi.fn(), select: vi.fn() }
    Object.defineProperty(globalThis, 'document', {
      value: {
        createElement: () => textarea,
        body: { appendChild: vi.fn(), removeChild: vi.fn() },
        execCommand: () => true,
      },
      configurable: true,
      writable: true,
    })

    expect(await copyToClipboard('after-throw')).toBe(true)
  })

  it('returns false when both paths fail', async () => {
    const writeText = vi.fn(async () => {
      throw new Error('blocked')
    })
    Object.defineProperty(globalThis, 'navigator', {
      value: { clipboard: { writeText } },
      configurable: true,
      writable: true,
    })
    Object.defineProperty(globalThis, 'document', {
      value: {
        createElement: () => {
          throw new Error('no DOM')
        },
        body: { appendChild: vi.fn(), removeChild: vi.fn() },
        execCommand: () => false,
      },
      configurable: true,
      writable: true,
    })

    expect(await copyToClipboard('blocked')).toBe(false)
  })

  it('returns false when execCommand returns false', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { clipboard: undefined },
      configurable: true,
      writable: true,
    })
    Object.defineProperty(globalThis, 'document', {
      value: {
        createElement: () => ({ style: {}, setAttribute: vi.fn(), select: vi.fn() }),
        body: { appendChild: vi.fn(), removeChild: vi.fn() },
        execCommand: () => false,
      },
      configurable: true,
      writable: true,
    })

    expect(await copyToClipboard('exec-false')).toBe(false)
  })
})
