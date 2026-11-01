import type { Driver } from '@/entities/driver'
import type { Fleet } from '@/entities/fleet'
import type { Vehicle, VehicleDictionaries } from '@/entities/vehicle'
import type { LiveTrackPosition } from '@/entities/vehicle-position'

// Fictional data shaped like the examples in API.md.

export const fleets: Fleet[] = [
  { id: 'fleet-gdynia', name: 'Dostawy Gdynia' },
  { id: 'fleet-gdansk', name: 'Serwis Gdańsk' },
]

export const drivers: Driver[] = [
  { id: 'driver-nowak', name: 'Anna Nowak', firstName: 'Anna', lastName: 'Nowak' },
  { id: 'driver-kowalski', name: 'Piotr Kowalski', firstName: 'Piotr', lastName: 'Kowalski' },
  {
    id: 'driver-wisniewska',
    name: 'Katarzyna Wiśniewska',
    firstName: 'Katarzyna',
    lastName: 'Wiśniewska',
  },
]

export const dictionaries: VehicleDictionaries = {
  vehicleType: ['Unknown', 'Car', 'Van', 'SmallRigidTruck', 'TractorTrailer'],
  fuelType: ['Diesel', 'Petrol', 'Electric', 'Hybrid', 'LPG', 'Other'],
  vehicleManufacturer: [
    { id: 'make-mercedes', key: 'Mercedes-Benz' },
    { id: 'make-ford', key: 'Ford' },
  ],
  vehicleModels: [
    {
      id: 'model-sprinter',
      key: 'Sprinter',
      manufacturerId: 'make-mercedes',
      manufacturerName: 'Mercedes-Benz',
    },
    {
      id: 'model-vito',
      key: 'Vito',
      manufacturerId: 'make-mercedes',
      manufacturerName: 'Mercedes-Benz',
    },
    { id: 'model-transit', key: 'Transit', manufacturerId: 'make-ford', manufacturerName: 'Ford' },
    {
      id: 'model-etransit',
      key: 'E-Transit',
      manufacturerId: 'make-ford',
      manufacturerName: 'Ford',
    },
  ],
}

export const sprinter01: Vehicle = {
  id: 'vehicle-sprinter-01',
  name: 'Sprinter 01',
  registrationNumber: 'GA 4K215',
  manufacturer: { id: 'make-mercedes', name: 'Mercedes-Benz' },
  model: { id: 'model-sprinter', name: 'Sprinter' },
  yearOfManufacture: 2021,
  type: 'Van',
  fuelType: 'Diesel',
  fleet: { id: 'fleet-gdynia', name: 'Dostawy Gdynia' },
  driver: { id: 'driver-nowak', name: 'Anna Nowak' },
}

export const sprinter02: Vehicle = {
  ...sprinter01,
  id: 'vehicle-sprinter-02',
  name: 'Sprinter 02',
  registrationNumber: 'GA 7M302',
  yearOfManufacture: 2022,
  driver: { id: 'driver-kowalski', name: 'Piotr Kowalski' },
}

export const eTransit: Vehicle = {
  id: 'vehicle-etransit',
  name: 'e-Transit Sopot',
  registrationNumber: 'GSP 2E41',
  manufacturer: { id: 'make-ford', name: 'Ford' },
  model: { id: 'model-etransit', name: 'E-Transit' },
  yearOfManufacture: 2023,
  type: 'SmallRigidTruck',
  fuelType: 'Electric',
  fleet: { id: 'fleet-gdansk', name: 'Serwis Gdańsk' },
  driver: { id: 'driver-wisniewska', name: 'Katarzyna Wiśniewska' },
}

export const transit05: Vehicle = {
  id: 'vehicle-transit-05',
  name: 'Transit 05',
  registrationNumber: 'GD 1D660',
  manufacturer: { id: 'make-ford', name: 'Ford' },
  model: { id: 'model-transit', name: 'Transit' },
  yearOfManufacture: 2016,
  type: 'Van',
  fuelType: 'Petrol',
  fleet: { id: 'fleet-gdansk', name: 'Serwis Gdańsk' },
  driver: null,
}

export const vehicles: Vehicle[] = [sprinter01, sprinter02, eTransit, transit05]

/** "Now" for tests that depend on report ages. */
export const NOW = Date.parse('2026-10-30T09:16:00.000Z')

export const position = (
  vehicleId: string,
  overrides: Partial<LiveTrackPosition> = {},
): LiveTrackPosition => ({
  vehicleId,
  latitude: 54.507842,
  longitude: 18.538114,
  heading: 152,
  speed: 41,
  lastReportedTime: new Date(NOW - 5_000).toISOString(),
  ...overrides,
})
