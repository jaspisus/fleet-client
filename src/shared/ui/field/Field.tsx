import type { ComponentProps, ReactNode } from 'react'
import { cx } from '@/shared/lib'
import { fieldErrorId } from './fieldErrorId'
import styles from './Field.module.css'

interface FieldProps {
  id: string
  label: string
  error?: string
  className?: string
  children: ReactNode
}

/** Label, control and error message. The control itself gets `id` and `aria-describedby`. */
export const Field = ({ id, label, error, className, children }: FieldProps) => (
  <div className={cx(styles.field, className)}>
    <label htmlFor={id} className={styles.label}>
      {label}
    </label>
    {children}
    {error && (
      <p id={fieldErrorId(id)} className={styles.error}>
        {error}
      </p>
    )}
  </div>
)

type TextInputProps = ComponentProps<'input'> & { invalid?: boolean }

export const TextInput = ({ invalid, className, ...props }: TextInputProps) => (
  <input className={cx(styles.control, className)} aria-invalid={invalid || undefined} {...props} />
)

type SelectProps = ComponentProps<'select'> & { invalid?: boolean }

export const Select = ({ invalid, className, ...props }: SelectProps) => (
  <select
    className={cx(styles.control, styles.select, className)}
    aria-invalid={invalid || undefined}
    {...props}
  />
)
