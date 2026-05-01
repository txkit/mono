import { describe, it, expect } from 'vitest'
import { cx } from './index'


describe('cx', () => {
  it('joins string arguments', () => {
    expect(cx('a', 'b', 'c')).toBe('a b c')
  })

  it('filters out falsy values', () => {
    expect(cx('a', undefined, null, false, 'b')).toBe('a b')
  })

  it('handles object with boolean values', () => {
    expect(cx('base', { active: true, disabled: false })).toBe('base active')
  })

  it('handles mixed args', () => {
    expect(cx('btn', undefined, { 'btn-primary': true, 'btn-disabled': false })).toBe('btn btn-primary')
  })

  it('returns empty string for no truthy args', () => {
    expect(cx(undefined, null, false)).toBe('')
  })

  it('handles single string', () => {
    expect(cx('only')).toBe('only')
  })

  it('handles undefined object values', () => {
    expect(cx({ a: undefined, b: true })).toBe('b')
  })
})
