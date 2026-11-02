import { compareText, formatDateTime, formatRelativeTime, formatSpeed } from './format'
import { useLanguage } from './useLanguage'

/** Intl formatters bound to the current UI language; components re-render when it changes. */
export const useFormatters = () => {
  const language = useLanguage()

  return {
    language,
    relativeTime: (timestamp: number, now: number) => formatRelativeTime(timestamp, now, language),
    dateTime: (timestamp: number) => formatDateTime(timestamp, language),
    speed: (kilometersPerHour: number) => formatSpeed(kilometersPerHour, language),
    compare: (a: string, b: string) => compareText(a, b, language),
  }
}
