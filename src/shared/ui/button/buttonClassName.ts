import { cx } from '@/shared/lib'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

export interface ButtonStyleOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

/** Button look for other elements, e.g. a router `<Link>` that should look like a button. */
export const buttonClassName = ({
  variant = 'secondary',
  size = 'md',
  className,
}: ButtonStyleOptions = {}) => cx(styles.button, styles[variant], styles[size], className)
