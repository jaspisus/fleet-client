import { describe, expect, it } from 'vitest'
import { isOneOf } from './isOneOf'

const SIZES = ['sm', 'md'] as const

describe('isOneOf', () => {
  it.each(['sm', 'md'])('accepts %j', (value) => {
    expect(isOneOf(SIZES, value)).toBe(true)
  })

  it.each(['lg', 'SM', '', undefined, null, 1])('rejects %j', (value) => {
    expect(isOneOf(SIZES, value)).toBe(false)
  })
})
