import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '@/shared/lib'
import { Button } from '../button/Button'
import { VisuallyHidden } from '../layout/Layout'
import styles from './Feedback.module.css'

interface SpinnerProps {
  label: string
  className?: string
}

export const Spinner = ({ label, className }: SpinnerProps) => (
  <span role="status" className={cx(styles.spinnerWrapper, className)}>
    <span className={styles.spinner} aria-hidden="true" />
    <VisuallyHidden>{label}</VisuallyHidden>
  </span>
)

export const LoadingState = ({ label }: { label?: string }) => {
  const { t } = useTranslation()
  return (
    <div className={styles.state}>
      <Spinner label={label ?? t('common.loading')} />
    </div>
  )
}

interface ErrorStateProps {
  title: string
  description?: string
  onRetry?: () => void
}

export const ErrorState = ({ title, description, onRetry }: ErrorStateProps) => {
  const { t } = useTranslation()
  return (
    <div role="alert" className={cx(styles.state, styles.error)}>
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}

export const EmptyState = ({ children }: { children: ReactNode }) => (
  <div className={styles.state}>
    <p className={styles.description}>{children}</p>
  </div>
)

/** Inline message, e.g. a form-level error that is not tied to a single field. */
export const Alert = ({ children }: { children: ReactNode }) => (
  <div role="alert" className={styles.alert}>
    {children}
  </div>
)
