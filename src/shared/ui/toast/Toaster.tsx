import { useEffect, useEffectEvent, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { afterOwnAnimations, cx } from '@/shared/lib'
import { useToastStore, type Toast } from './toastStore'
import styles from './Toaster.module.css'

export const TOAST_DURATION_MS = 5_000

const ToastItem = ({ toast }: { toast: Toast }) => {
  const { t } = useTranslation()
  const dismiss = useToastStore((state) => state.dismiss)
  const itemRef = useRef<HTMLLIElement>(null)
  const isClosingRef = useRef(false)

  // Plays the exit animation before the toast leaves the store.
  const requestDismiss = () => {
    const item = itemRef.current
    if (!item || isClosingRef.current) return
    isClosingRef.current = true
    item.dataset.closing = ''
    afterOwnAnimations(item, () => dismiss(toast.id))
  }

  const dismissOnTimeout = useEffectEvent(requestDismiss)

  useEffect(() => {
    const id = setTimeout(dismissOnTimeout, TOAST_DURATION_MS)
    return () => clearTimeout(id)
  }, [])

  return (
    <li ref={itemRef} className={cx(styles.toast, styles[toast.tone])}>
      <p className={styles.message}>{toast.message}</p>
      <button
        type="button"
        className={styles.dismiss}
        onClick={requestDismiss}
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
