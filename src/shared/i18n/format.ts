import { getIntlLocale, type Language } from './languages'

const cached = <T>(create: (locale: string) => T) => {
  const cache = new Map<Language, T>()
  return (language: Language) => {
    let value = cache.get(language)
    if (!value) {
      value = create(getIntlLocale(language))
      cache.set(language, value)
    }
    return value
  }
}

const relativeTimeFormat = cached(
  (locale) => new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' }),
)
const dateTimeFormat = cached(
  (locale) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'medium' }),
)
const speedFormat = cached(
  (locale) =>
    new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: 'kilometer-per-hour',
      maximumFractionDigits: 0,
    }),
)
const collator = cached((locale) => new Intl.Collator(locale, { sensitivity: 'base' }))

const JUST_NOW_SECONDS = 10
const RELATIVE_UNITS: ReadonlyArray<[Intl.RelativeTimeFormatUnit, number]> = [
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
  ['second', 1],
]

/** "2 min ago". Future timestamps (clock skew between server and browser) read as "now". */
export const formatRelativeTime = (timestamp: number, now: number, language: Language) => {
  const elapsedSeconds = Math.max(0, Math.floor((now - timestamp) / 1000))
  const format = relativeTimeFormat(language)
  if (elapsedSeconds < JUST_NOW_SECONDS) return format.format(0, 'second')
  for (const [unit, seconds] of RELATIVE_UNITS) {
    if (elapsedSeconds >= seconds) return format.format(-Math.floor(elapsedSeconds / seconds), unit)
  }
  return format.format(0, 'second')
}

export const formatDateTime = (timestamp: number, language: Language) =>
  dateTimeFormat(language).format(timestamp)

export const formatSpeed = (kilometersPerHour: number, language: Language) =>
  speedFormat(language).format(kilometersPerHour)

/** Locale-aware, case-insensitive comparison, so Polish "Ś…" sorts after "S…" rather than after "Z…". */
export const compareText = (a: string, b: string, language: Language) =>
  collator(language).compare(a, b)
