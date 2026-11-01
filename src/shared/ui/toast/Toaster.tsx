import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '@/shared/lib'
import { useToastStore, type Toast } from './toastStore'
import styles from './Toaster.module.css'

export const TOAST_DURATION_MS = 5_000

const ToastItem = ({ toast }: { toast: Toast }) => {
  const { t } = useTranslation()
  const dismiss = useToastStore((state) => state.dismiss)

  useEffect(() => {
    const id = setTimeout(() => dismiss(toast.id), TOAST_DURATION_MS)
    return () => clearTimeout(id)
  }, [dismiss, toast.id])

  return (
    <li className={cx(styles.toast, styles[toast.tone])}>
      <p className={styles.message}>{toast.message}</p>
      <button
        type="button"
        className={styles.dismiss}
        onClick={() => dismiss(toast.id)}
        aria-label={t('toast.dismiss')}
      >
        <span aria-hidden="true">×</span>
      </button>
    </li>
  )
}

/** Live region for toasts. It is always rendered, so screen readers announce new messages. */
export const Toaster = () => {
  const { t } = useTranslation()
  const toasts = useToastStore((state) => state.toasts)

  return (
    <section className={styles.region} aria-label={t('toast.region')}>
      <ol className={styles.list} aria-live="polite">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </ol>
    </section>
  )
}
