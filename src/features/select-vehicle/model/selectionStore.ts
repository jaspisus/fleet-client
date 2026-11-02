import { create } from 'zustand'

interface SelectionState {
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
