/** Whether `value` is one of `values`; narrows it to their type. */
export const isOneOf = <T>(values: readonly T[], value: unknown): value is T =>
  values.some((item) => item === value)
