/** Joins truthy class names: `cx('a', isActive && 'b')`. */
export const cx = (...classNames: Array<string | false | null | undefined>) =>
  classNames.filter(Boolean).join(' ')
