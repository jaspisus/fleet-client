import { apiRequest, type ResourceCollection } from '@/shared/api'
import type { UpdateVehicleCommand, Vehicle, VehicleDictionaries } from '../model/types'

const vehiclePath = (id: string) => `/api/vehicles/${encodeURIComponent(id)}`

export const fetchVehicles = (signal?: AbortSignal) =>
  apiRequest<ResourceCollection<Vehicle>>('/api/vehicles', { signal })

export const fetchVehicle = (id: string, signal?: AbortSignal) =>
  apiRequest<Vehicle>(vehiclePath(id), { signal })

export const updateVehicle = (id: string, command: UpdateVehicleCommand) =>
  apiRequest<Vehicle>(vehiclePath(id), { method: 'PUT', body: command })

export const fetchVehicleDictionaries = (signal?: AbortSignal) =>
  apiRequest<VehicleDictionaries>('/api/dictionaries', { signal })
