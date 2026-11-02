import { cx } from '@/shared/lib'
import styles from './TruncatedText.module.css'

/** API text that may be long: cut with an ellipsis, with the full text in the tooltip. */
export const TruncatedText = ({ text, className }: { text: string; className?: string }) => (
  <span className={cx(styles.truncate, className)} title={text}>
    {text}
  </span>
)
