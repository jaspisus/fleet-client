import type { pl } from './locales/pl'

type PluralKey = `${string}_${'zero' | 'one' | 'two' | 'few' | 'many' | 'other'}`

/**
 * The shape every locale must have: the same keys as the Polish source, except plural forms,
 * because each language has its own set of them (Polish: one/few/many/other, English: one/other).
 */
type MessagesShape<T> = {
  [K in keyof T as K extends PluralKey ? never : K]: T[K] extends string
    ? string
    : MessagesShape<T[K]>
} & { [key: PluralKey]: string }

export type LocaleMessages = MessagesShape<typeof pl>
