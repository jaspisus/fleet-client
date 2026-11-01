import { describe, expect, it } from 'vitest'
import { isRegistrationNumberTaken, normalizeRegistrationNumber } from './registration'

describe('normalizeRegistrationNumber', () => {
  it('ignores whitespace and letter case, like the API', () => {
    expect(normalizeRegistrationNumber(' ga 4k215 ')).toBe('GA4K215')
    expect(normalizeRegistrationNumber('GA\t4K 215')).toBe('GA4K215')
  })
})

describe('isRegistrationNumberTaken', () => {
  const vehicles = [
    { id: 'a', registrationNumber: 'GA 4K215' },
    { id: 'b', registrationNumber: 'GA 7M302' },
  ]

  it('finds a plate used by another vehicle, in any spelling', () => {
    expect(isRegistrationNumberTaken(vehicles, 'ga7m302', 'a')).toBe(true)
  })

  it('does not count the edited vehicle itself', () => {
    expect(isRegistrationNumberTaken(vehicles, 'GA4K215', 'a')).toBe(false)
  })

  it('accepts a new plate', () => {
    expect(isRegistrationNumberTaken(vehicles, 'GD 12345', 'a')).toBe(false)
  })
})
