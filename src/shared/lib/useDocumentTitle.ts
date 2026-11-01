import { useEffect } from 'react'

/**
 * Sets `document.title` to "Page · App" (or just the app name) while the component is mounted,
 * and restores the previous title afterwards, so a closed dialog hands the title back to its page.
 */
export const useDocumentTitle = (appName: string, pageTitle?: string) => {
  useEffect(() => {
    const previousTitle = document.title
    document.title = pageTitle ? `${pageTitle} · ${appName}` : appName
    return () => {
      document.title = previousTitle
    }
  }, [appName, pageTitle])
}
