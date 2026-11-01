import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './locales/en'
import { pl } from './locales/pl'

export const LANGUAGES = ['pl', 'en'] as const
export type Language = (typeof LANGUAGES)[number]
export const DEFAULT_LANGUAGE: Language = 'pl'
export const LANGUAGE_STORAGE_KEY = 'fleet-panel.language'

export const isLanguage = (value: unknown): value is Language =>
  LANGUAGES.some((language) => language === value)

const readStoredLanguage = (): Language | undefined => {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return isLanguage(stored) ? stored : undefined
  } catch {
    // Storage can be blocked (private mode, disabled site data); fall back to the default.
    return undefined
  }
}

const storeLanguage = (language: Language) => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    // The choice then lasts only for this page load, which is acceptable.
  }
}

export const i18n = i18next.createInstance()

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language
})

void i18n.use(initReactI18next).init({
  resources: { pl: { translation: pl }, en: { translation: en } },
  lng: readStoredLanguage() ?? DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: LANGUAGES,
  interpolation: { escapeValue: false },
  initAsync: false,
})

export const getLanguage = (): Language =>
  isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : DEFAULT_LANGUAGE

/** Switches the UI language and remembers the choice for the next visit. */
export const changeLanguage = async (language: Language) => {
  await i18n.changeLanguage(language)
  storeLanguage(language)
}
