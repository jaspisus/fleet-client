import { useEffect, useId, useRef, type ReactNode, type SyntheticEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { afterOwnAnimations } from '@/shared/lib'
import styles from './Dialog.module.css'
import { DialogCloseContext } from './DialogContext'

interface DialogProps {
  title: string
  onClose: () => void
  /** While true (e.g. during a save), Esc and the close button do nothing. */
  closeDisabled?: boolean
  /** Extra header controls, placed before the close button. */
  actions?: ReactNode
  children: ReactNode
}

/**
 * Modal built on the native `<dialog>`: `showModal()` provides the focus trap, Esc handling and
 * an inert page behind it. It is open for as long as it is mounted; closing is up to the parent,
 * which usually navigates away. Clicking the backdrop does not close it, so edits are not lost.
 * Esc, the close button and `useCloseDialog()` play the exit animation before calling `onClose`.
 */
export const Dialog = ({
  title,
  onClose,
  closeDisabled = false,
  actions,
  children,
}: DialogProps) => {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const isClosingRef = useRef(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    // An open dialog locks the page scroll (global.css), which hides the scrollbar. Keep its space
    // so the page does not shift; only when there was one, or the page would shift the other way.
    const root = document.documentElement
    if (window.innerWidth > root.clientWidth) root.style.scrollbarGutter = 'stable'
    if (!dialog.open) dialog.showModal()
    return () => {
      root.style.scrollbarGutter = ''
      dialog.close()
      if (opener?.isConnected) opener.focus()
    }
  }, [])

  const requestClose = () => {
    const dialog = dialogRef.current
    if (!dialog || isClosingRef.current) return
    isClosingRef.current = true
    dialog.dataset.closing = ''
    afterOwnAnimations(dialog, onClose)
  }

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault()
    if (!closeDisabled) requestClose()
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
        <div className={styles.headerActions}>
          {actions}
          <button
            type="button"
            className={styles.close}
            onClick={requestClose}
            disabled={closeDisabled}
            aria-label={t('common.close')}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </div>
      <div className={styles.body}>
        <DialogCloseContext value={requestClose}>{children}</DialogCloseContext>
      </div>
    </dialog>
  )
}
