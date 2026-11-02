import { useEffect, useState } from 'react'

/** Current time, refreshed on an interval. */
export const useNow = (intervalMs = 10_000) => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
