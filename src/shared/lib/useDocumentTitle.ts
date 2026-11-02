import { useEffect } from 'react'

/**
 * Sets `document.title` to "Page · App" (or just the app name) while the component is mounted
 * and `enabled`, and restores the previous title afterwards.
 */
export const useDocumentTitle = (appName: string, pageTitle?: string, enabled = true) => {
  useEffect(() => {
    if (!enabled) return
    const previousTitle = document.title
    document.title = pageTitle ? `${pageTitle} · ${appName}` : appName
    return () => {
      document.title = previousTitle
    }
  }, [appName, pageTitle, enabled])
}
