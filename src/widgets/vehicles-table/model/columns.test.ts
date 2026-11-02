import { describe, expect, it } from 'vitest'
import { isSortableColumnId, normalizeSearchText, parseSortParam, toSortParam } from './columns'

describe('sort URL parameter', () => {
  it.each([
    ['name', { column: 'name', desc: false }],
    ['-yearOfManufacture', { column: 'yearOfManufacture', desc: true }],
  ] as const)('parses %s', (value, sort) => {
    expect(parseSortParam(value)).toEqual(sort)
    expect(toSortParam(sort)).toBe(value)
  })

  it.each([undefined, '', 'actions', '-unknown'])('ignores %j', (value) => {
    expect(parseSortParam(value)).toBeUndefined()
  })

  it('serialises "no sort" as no parameter', () => {
    expect(toSortParam(undefined)).toBeUndefined()
  })
})

describe('isSortableColumnId', () => {
  it('accepts data columns only', () => {
    expect(isSortableColumnId('name')).toBe(true)
    expect(isSortableColumnId('makeModel')).toBe(true)
    expect(isSortableColumnId('actions')).toBe(false)
    expect(isSortableColumnId('unknown')).toBe(false)
  })
})

describe('normalizeSearchText', () => {
  it('ignores case, whitespace and Polish diacritics', () => {
    expect(normalizeSearchText('Katarzyna Wiśniewska')).toBe('katarzynawisniewska')
    expect(normalizeSearchText('Paweł Żółć')).toBe('pawelzolc')
    expect(normalizeSearchText('GA 4K215')).toBe('ga4k215')
  })

  it('handles numbers and missing values', () => {
    expect(normalizeSearchText(2021)).toBe('2021')
    expect(normalizeSearchText(null)).toBe('')
  })
})
