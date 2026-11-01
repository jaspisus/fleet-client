import { useEffect, useState } from 'react'

/** Current time that refreshes on an interval, for labels such as "2 minutes ago". */
export const useNow = (intervalMs = 10_000) => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
