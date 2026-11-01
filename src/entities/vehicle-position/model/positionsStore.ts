import { create } from 'zustand'
import type { LiveTrackPosition } from './types'

export type PositionsById = Record<string, LiveTrackPosition>

/**
 * Applies new positions, keeping only ones newer than what is stored. The subscription snapshot
 * can arrive after a `LiveTrack` event, and must not move a vehicle back in time.
 * Returns the same object when nothing changed, so subscribers do not re-render.
 */
export const mergePositions = (
  current: PositionsById,
  incoming: readonly LiveTrackPosition[],
): PositionsById => {
  let next = current
  for (const position of incoming) {
    const existing = next[position.vehicleId]
    if (existing && Date.parse(existing.lastReportedTime) >= Date.parse(position.lastReportedTime))
      continue
    if (next === current) next = { ...current }
    next[position.vehicleId] = position
  }
  return next
}

interface PositionsState {
  positions: PositionsById
  upsertPositions: (incoming: readonly LiveTrackPosition[]) => void
}

export const usePositionsStore = create<PositionsState>()((set) => ({
  positions: {},
  upsertPositions: (incoming) =>
    set((state) => {
      const positions = mergePositions(state.positions, incoming)
      return positions === state.positions ? state : { positions }
    }),
}))

export const upsertPositions = (incoming: readonly LiveTrackPosition[]) =>
  usePositionsStore.getState().upsertPositions(incoming)

export const usePositions = () => usePositionsStore((state) => state.positions)
