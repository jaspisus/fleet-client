import { describe, expect, it } from 'vitest'
import { compareText, formatDateTime, formatRelativeTime, formatSpeed } from './format'

const NOW = Date.parse('2026-10-30T12:00:00Z')
const ago = (seconds: number) => NOW - seconds * 1000

describe('formatRelativeTime', () => {
  it.each([
    [3, 'pl', 'teraz'],
    [3, 'en', 'now'],
    [45, 'en', '45 sec ago'],
    [45, 'pl', '45 sek. temu'],
    [90, 'en', '1 min ago'],
    [125, 'pl', '2 min temu'],
    [3 * 3600, 'en', '3 hr ago'],
    [3 * 3600, 'pl', '3 godz. temu'],
    [2 * 86_400, 'pl', 'przedwczoraj'],
    [5 * 86_400, 'en', '5 days ago'],
  ] as const)('%i s ago in %s is "%s"', (seconds, language, expected) => {
    expect(formatRelativeTime(ago(seconds), NOW, language)).toBe(expected)
  })

  it('reads a report from the near future (clock skew) as now', () => {
    expect(formatRelativeTime(NOW + 30_000, NOW, 'en')).toBe('now')
  })
})

describe('formatSpeed', () => {
  it('formats km/h for the language', () => {
    expect(formatSpeed(41, 'en')).toBe('41 km/h')
    expect(formatSpeed(41, 'pl')).toBe('41 km/godz.')
  })
})

describe('formatDateTime', () => {
  it('uses day-month-year in both languages', () => {
    expect(formatDateTime(NOW, 'en')).toBe('30 Oct 2026, 12:00:00')
    expect(formatDateTime(NOW, 'pl')).toBe('30 paź 2026, 12:00:00')
  })
})

describe('compareText', () => {
  it('sorts Polish letters after their base letter', () => {
    const names = ['Żukowo', 'Zaspa', 'Śliwa', 'Szymański', 'Sopot']
    expect([...names].sort((a, b) => compareText(a, b, 'pl'))).toEqual([
      'Sopot',
      'Szymański',
      'Śliwa',
      'Zaspa',
      'Żukowo',
    ])
  })

  it('ignores letter case', () => {
    expect(compareText('sprinter', 'Sprinter', 'en')).toBe(0)
  })
})
