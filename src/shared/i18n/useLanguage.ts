import { useTranslation } from 'react-i18next'
import { DEFAULT_LANGUAGE, isLanguage, type Language } from './languages'

/** The current UI language; the component re-renders when it changes. */
export const useLanguage = (): Language => {
  const { i18n } = useTranslation()
  return isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : DEFAULT_LANGUAGE
}
