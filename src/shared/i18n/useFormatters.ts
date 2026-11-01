import { useTranslation } from 'react-i18next'
import { compareText, formatDateTime, formatRelativeTime, formatSpeed } from './format'
import { DEFAULT_LANGUAGE, isLanguage } from './i18n'

/** Intl formatters bound to the current UI language; components re-render when it changes. */
export const useFormatters = () => {
  const { i18n } = useTranslation()
  const language = isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : DEFAULT_LANGUAGE

  return {
    language,
    relativeTime: (timestamp: number, now: number) => formatRelativeTime(timestamp, now, language),
    dateTime: (timestamp: number) => formatDateTime(timestamp, language),
    speed: (kilometersPerHour: number) => formatSpeed(kilometersPerHour, language),
    compare: (a: string, b: string) => compareText(a, b, language),
  }
}
