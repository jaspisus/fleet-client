import { createContext, useContext } from 'react'

export const DialogCloseContext = createContext<(() => void) | null>(null)

/**
 * Closes the surrounding `Dialog` the same way its close button does: the exit animation plays
 * first, then the dialog's `onClose` runs.
 */
export const useCloseDialog = () => {
  const close = useContext(DialogCloseContext)
  if (!close) throw new Error('useCloseDialog must be used inside a Dialog')
  return close
}
