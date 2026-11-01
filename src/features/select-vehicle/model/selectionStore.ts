import { create } from 'zustand'

interface SelectionState {
  /** Vehicle selected on the live map, shared by the list, the map and "Show on map". */
  selectedVehicleId: string | null
  selectVehicle: (vehicleId: string | null) => void
}

export const useSelectionStore = create<SelectionState>()((set) => ({
  selectedVehicleId: null,
  selectVehicle: (vehicleId) => set({ selectedVehicleId: vehicleId }),
}))

export const useSelectedVehicleId = () => useSelectionStore((state) => state.selectedVehicleId)

export const selectVehicle = (vehicleId: string | null) =>
  useSelectionStore.getState().selectVehicle(vehicleId)
