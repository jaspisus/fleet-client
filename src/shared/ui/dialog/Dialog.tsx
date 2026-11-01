import { useEffect, useId, useRef, type ReactNode, type SyntheticEvent } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './Dialog.module.css'

interface DialogProps {
  title: string
  onClose: () => void
  /** While true (e.g. during a save), Esc and the close button do nothing. */
  closeDisabled?: boolean
  children: ReactNode
}

/**
 * Modal built on the native `<dialog>`: `showModal()` provides the focus trap, Esc handling and
 * an inert page behind it. It is open for as long as it is mounted; closing is up to the parent,
 * which usually navigates away. Clicking the backdrop does not close it, so edits are not lost.
 */
export const Dialog = ({ title, onClose, closeDisabled = false, children }: DialogProps) => {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (!dialog.open) dialog.showModal()
    return () => {
      dialog.close()
      if (opener?.isConnected) opener.focus()
    }
  }, [])

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault()
    if (!closeDisabled) onClose()
  }

  // Browsers may still force-close a modal (e.g. a repeated Esc); keep the route in sync with it.
  // `close` fires asynchronously, so one queued by a remount (StrictMode) arrives while the
  // dialog is open again; that one is ignored.
  const handleClose = () => {
    if (!dialogRef.current?.open) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClose={handleClose}
    >
      <div className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          disabled={closeDisabled}
          aria-label={t('common.close')}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div className={styles.body}>{children}</div>
    </dialog>
  )
}
