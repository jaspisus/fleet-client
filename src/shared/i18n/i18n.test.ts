import { describe, expect, it } from 'vitest'
import { changeLanguage, getLanguage, i18n, LANGUAGE_STORAGE_KEY } from './i18n'
import { getIntlLocale, getMessages, LANGUAGES } from './languages'
import { pl } from './locales/pl'

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/

const flattenKeys = (messages: object, prefix = ''): string[] =>
  Object.entries(messages).flatMap(([key, value]) =>
    typeof value === 'string'
      ? [`${prefix}${key}`]
      : flattenKeys(value as object, `${prefix}${key}.`),
  )

const withoutPluralSuffix = (keys: string[]) => keys.map((key) => key.replace(PLURAL_SUFFIX, ''))

const pluralBaseKeys = new Set(
  withoutPluralSuffix(flattenKeys(pl).filter((key) => PLURAL_SUFFIX.test(key))),
)

describe('translations', () => {
  it.each(LANGUAGES)('%s has the same keys as Polish', (language) => {
    expect(new Set(withoutPluralSuffix(flattenKeys(getMessages(language))))).toEqual(
      new Set(withoutPluralSuffix(flattenKeys(pl))),
    )
  })

  it.each(LANGUAGES)('%s has exactly the plural forms the language needs', (language) => {
    const categories = new Intl.PluralRules(getIntlLocale(language)).resolvedOptions()
      .pluralCategories
    const keys = flattenKeys(getMessages(language))

    for (const base of pluralBaseKeys) {
      expect(new Set(keys.filter((key) => key.replace(PLURAL_SUFFIX, '') === base))).toEqual(
        new Set(categories.map((category) => `${base}_${category}`)),
      )
    }
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
