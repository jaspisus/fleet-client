import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { DEFAULT_LANGUAGE, getMessages, isLanguage, type Language, LANGUAGES } from './languages'

export const LANGUAGE_STORAGE_KEY = 'fleet-panel.language'

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
    // Blocked storage: the choice lasts only for this page load.
  }
}

export const i18n = i18next.createInstance()

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language
})

void i18n.use(initReactI18next).init({
  resources: Object.fromEntries(
    LANGUAGES.map((language) => [language, { translation: getMessages(language) }]),
  ),
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
