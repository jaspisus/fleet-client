import { useState } from 'react'

/**
 * State of a search input mirrored into a URL param. Returns the input value and a change handler
 * that also calls `onChange`; a URL value the input did not send (e.g. from a link) replaces it.
 */
export const useSearchInput = (
  urlValue: string | undefined,
  onChange: (value: string | undefined) => void,
) => {
  // URL updates are asynchronous: values this input sent may arrive after newer keystrokes.
  const [value, setValue] = useState(urlValue ?? '')
  const [seenUrlValue, setSeenUrlValue] = useState(urlValue)
  const [sentValues, setSentValues] = useState<Array<string | undefined>>([])
  if (urlValue !== seenUrlValue) {
    setSeenUrlValue(urlValue)
    const sentIndex = sentValues.indexOf(urlValue)
    if (sentIndex === -1) {
      setValue(urlValue ?? '')
      setSentValues([])
    } else {
      setSentValues(sentValues.slice(sentIndex + 1))
    }
  }

  const change = (next: string) => {
    const sent = next || undefined
    setValue(next)
    setSentValues((current) => [...current, sent])
    onChange(sent)
  }

  return [value, change] as const
}
