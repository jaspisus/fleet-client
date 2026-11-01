import { describe, expect, it } from 'vitest'
import { changeLanguage, getLanguage, i18n, LANGUAGE_STORAGE_KEY } from './i18n'
import { en } from './locales/en'
import { pl } from './locales/pl'

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/

const flattenKeys = (messages: object, prefix = ''): string[] =>
  Object.entries(messages).flatMap(([key, value]) =>
    typeof value === 'string'
      ? [`${prefix}${key}`.replace(PLURAL_SUFFIX, '')]
      : flattenKeys(value as object, `${prefix}${key}.`),
  )

describe('translations', () => {
  it('has the same keys in Polish and English', () => {
    expect(new Set(flattenKeys(en))).toEqual(new Set(flattenKeys(pl)))
  })

  it('has every plural form each language needs', () => {
    expect(Object.keys(pl.vehicles).filter((key) => key.startsWith('count_'))).toEqual([
      'count_one',
      'count_few',
      'count_many',
      'count_other',
    ])
    expect(Object.keys(en.vehicles).filter((key) => key.startsWith('count_'))).toEqual([
      'count_one',
      'count_other',
    ])
  })

  it('uses Polish plural forms', () => {
    expect(i18n.t('vehicles.count', { count: 1 })).toBe('1 pojazd')
    expect(i18n.t('vehicles.count', { count: 3 })).toBe('3 pojazdy')
    expect(i18n.t('vehicles.count', { count: 5 })).toBe('5 pojazdów')
    expect(i18n.t('vehicles.count', { count: 22 })).toBe('22 pojazdy')
  })
})

describe('language', () => {
  it('is Polish by default', () => {
    expect(getLanguage()).toBe('pl')
    expect(document.documentElement.lang).toBe('pl')
  })

  it('switches, sets <html lang> and remembers the choice', async () => {
    await changeLanguage('en')

    expect(getLanguage()).toBe('en')
    expect(i18n.t('vehicles.count', { count: 2 })).toBe('2 vehicles')
    expect(document.documentElement.lang).toBe('en')
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en')
  })
})
