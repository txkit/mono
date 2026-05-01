import { describe, it, expect } from 'vitest'
import { deepEqual } from './index'


describe('deepEqual', () => {
  it('compares primitives', () => {
    expect(deepEqual(1, 1)).toBe(true)
    expect(deepEqual(1, 2)).toBe(false)
    expect(deepEqual('a', 'a')).toBe(true)
    expect(deepEqual(true, true)).toBe(true)
    expect(deepEqual(null, null)).toBe(true)
    expect(deepEqual(undefined, undefined)).toBe(true)
  })

  it('handles null vs non-null', () => {
    expect(deepEqual(null, {})).toBe(false)
    expect(deepEqual({}, null)).toBe(false)
  })

  it('handles different types', () => {
    expect(deepEqual(1, '1')).toBe(false)
    expect(deepEqual([], {})).toBe(false)
  })

  it('compares flat objects', () => {
    expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true)
    expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false)
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
  })

  it('compares nested objects', () => {
    expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true)
    expect(deepEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false)
  })

  it('compares arrays', () => {
    expect(deepEqual([ 1, 2, 3 ], [ 1, 2, 3 ])).toBe(true)
    expect(deepEqual([ 1, 2 ], [ 1, 2, 3 ])).toBe(false)
    expect(deepEqual([ 1, 2, 3 ], [ 1, 3, 2 ])).toBe(false)
  })

  it('compares mixed nested structures', () => {
    const a = { arr: [ 1, { x: 2 }], obj: { y: 3 } }
    const b = { arr: [ 1, { x: 2 }], obj: { y: 3 } }
    const c = { arr: [ 1, { x: 99 }], obj: { y: 3 } }

    expect(deepEqual(a, b)).toBe(true)
    expect(deepEqual(a, c)).toBe(false)
  })

  it('reference equality short-circuits', () => {
    const obj = { a: 1 }
    expect(deepEqual(obj, obj)).toBe(true)
  })
})
