// Fictional data shaped like the examples in API.md. Times are relative to FIXED_NOW, which the
// tests install as the browser clock.

export const API_ORIGIN = 'http://fleet-api.test'
export const FIXED_NOW = new Date('2026-10-30T09:16:00.000Z')

const secondsAgo = (seconds: number) => new Date(FIXED_NOW.getTime() - seconds * 1000).toISOString()

export const fleets = [
  { id: 'fleet-gdynia', name: 'Dostawy Gdynia' },
  { id: 'fleet-gdansk', name: 'Serwis Gdańsk' },
  { id: 'fleet-tricity', name: 'Kurierzy Trójmiasto' },
]

export const drivers = [
  { id: 'driver-nowak', name: 'Anna Nowak', firstName: 'Anna', lastName: 'Nowak' },
  { id: 'driver-kowalski', name: 'Piotr Kowalski', firstName: 'Piotr', lastName: 'Kowalski' },
  {
    id: 'driver-wisniewska',
    name: 'Katarzyna Wiśniewska',
    firstName: 'Katarzyna',
    lastName: 'Wiśniewska',
  },
  { id: 'driver-wojcik', name: 'Tomasz Wójcik', firstName: 'Tomasz', lastName: 'Wójcik' },
]

export const dictionaries = {
  vehicleType: ['Unknown', 'Car', 'Van', 'SmallRigidTruck', 'TractorTrailer'],
  fuelType: ['Diesel', 'Petrol', 'Electric', 'Hybrid', 'LPG', 'Other'],
  vehicleManufacturer: [
    { id: 'make-mercedes', key: 'Mercedes-Benz' },
    { id: 'make-ford', key: 'Ford' },
    { id: 'make-scania', key: 'Scania' },
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
    { id: 'model-r450', key: 'R 450', manufacturerId: 'make-scania', manufacturerName: 'Scania' },
  ],
}

const ref = <T extends { id: string; name?: string; key?: string }>(item: T) => ({
  id: item.id,
  name: item.name ?? item.key ?? '',
})
const [gdynia, gdansk, tricity] = fleets.map(ref)
const [nowak, kowalski, wisniewska, wojcik] = drivers.map(ref)
const mercedes = { id: 'make-mercedes', name: 'Mercedes-Benz' }
const ford = { id: 'make-ford', name: 'Ford' }

export const vehicles = [
  {
    id: 'vehicle-sprinter-01',
    name: 'Sprinter 01',
    registrationNumber: 'GA 4K215',
    manufacturer: mercedes,
    model: { id: 'model-sprinter', name: 'Sprinter' },
    yearOfManufacture: 2021,
    type: 'Van',
    fuelType: 'Diesel',
    fleet: gdynia,
    driver: nowak,
  },
  {
    id: 'vehicle-sprinter-02',
    name: 'Sprinter 02',
    registrationNumber: 'GA 7M302',
    manufacturer: mercedes,
    model: { id: 'model-sprinter', name: 'Sprinter' },
    yearOfManufacture: 2022,
    type: 'Van',
    fuelType: 'Diesel',
    fleet: gdynia,
    driver: kowalski,
  },
  {
    id: 'vehicle-etransit',
    name: 'e-Transit Sopot',
    registrationNumber: 'GSP 2E41',
    manufacturer: ford,
    model: { id: 'model-etransit', name: 'E-Transit' },
    yearOfManufacture: 2023,
    type: 'Van',
    fuelType: 'Electric',
    fleet: tricity,
    driver: wisniewska,
  },
  {
    id: 'vehicle-scania',
    name: 'Ciągnik S6',
    registrationNumber: 'GA 9W730',
    manufacturer: { id: 'make-scania', name: 'Scania' },
    model: { id: 'model-r450', name: 'R 450' },
    yearOfManufacture: 2020,
    type: 'TractorTrailer',
    fuelType: 'Diesel',
    fleet: gdynia,
    driver: wojcik,
  },
  {
    id: 'vehicle-transit-05',
    name: 'Transit 05',
    registrationNumber: 'GD 1D660',
    manufacturer: ford,
    model: { id: 'model-transit', name: 'Transit' },
    yearOfManufacture: 2016,
    type: 'Van',
    fuelType: 'Petrol',
    fleet: gdansk,
    driver: null,
  },
]

/**
 * Snapshot returned by SubscribeLiveTrack. "e-Transit Sopot" stands exactly in the middle of the
 * map's initial view, so a click on the centre of the map hits it.
 */
export const MAP_CENTER_VEHICLE = 'e-Transit Sopot'

export const positions = [
  {
    vehicleId: 'vehicle-sprinter-01',
    latitude: 54.5203,
    longitude: 18.5305,
    heading: 152,
    speed: 41,
    lastReportedTime: secondsAgo(3),
  },
  {
    vehicleId: 'vehicle-sprinter-02',
    latitude: 54.3722,
    longitude: 18.6383,
    heading: 270,
    speed: 0,
    lastReportedTime: secondsAgo(40),
  },
  {
    vehicleId: 'vehicle-etransit',
    latitude: 54.44,
    longitude: 18.57,
    heading: 20,
    speed: 33,
    lastReportedTime: secondsAgo(2),
  },
  {
    vehicleId: 'vehicle-scania',
    latitude: 54.53,
    longitude: 18.47,
    heading: 0,
    speed: 0,
    lastReportedTime: secondsAgo(3 * 86_400),
  },
]

export const positionUpdate = (vehicleId: string, changes: Record<string, unknown>) => ({
  ...positions.find((position) => position.vehicleId === vehicleId),
  lastReportedTime: secondsAgo(0),
  ...changes,
})
