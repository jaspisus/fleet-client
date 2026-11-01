import gbFlag from './flags/gb.svg'
import plFlag from './flags/pl.svg'
import { en } from './locales/en'
import { pl } from './locales/pl'

/**
 * Every supported UI language. Adding one takes a locale file, a 4:3 flag SVG and an entry here;
 * the order is the order in the language dropdown.
 */
const LANGUAGE_REGISTRY = {
  pl: { name: 'Polski', flag: plFlag, intlLocale: 'pl-PL', messages: pl },
  // en-GB, so English uses day-month-year dates and 24-hour time.
  en: { name: 'English', flag: gbFlag, intlLocale: 'en-GB', messages: en },
} as const

export type Language = keyof typeof LANGUAGE_REGISTRY

export const LANGUAGES = Object.keys(LANGUAGE_REGISTRY) as Language[]
export const DEFAULT_LANGUAGE: Language = 'pl'

export const isLanguage = (value: unknown): value is Language =>
  LANGUAGES.some((language) => language === value)

/** The language's own name ("English", "Polski"), the same whatever the UI language is. */
export const getLanguageName = (language: Language) => LANGUAGE_REGISTRY[language].name

/** URL of the language's flag; small SVGs are inlined into the bundle as data URLs. */
export const getLanguageFlag = (language: Language) => LANGUAGE_REGISTRY[language].flag

/** Full locale for Intl formatters. */
export const getIntlLocale = (language: Language) => LANGUAGE_REGISTRY[language].intlLocale

export const getMessages = (language: Language) => LANGUAGE_REGISTRY[language].messages
