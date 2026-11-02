import { describe, expect, it } from 'vitest'
import { mapServerErrors, translateServerMessage } from './serverErrors'

describe('translateServerMessage', () => {
  // Every validation message listed in API.md.
  it.each([
    ['Name is required.', { key: 'validation.name.required' }],
    [
      'Name must be between 2 and 60 characters long.',
      { key: 'validation.name.length', params: { min: 2, max: 60 } },
    ],
    ['Registration number is required.', { key: 'validation.registrationNumber.required' }],
    [
      'Registration number must be at most 50 characters long.',
      { key: 'validation.registrationNumber.tooLong', params: { max: 50 } },
    ],
    [
      'Registration number is already used by another vehicle.',
      { key: 'validation.registrationNumber.taken' },
    ],
    ['Manufacturer is required.', { key: 'validation.manufacturerId.required' }],
    ['Manufacturer does not exist.', { key: 'validation.manufacturerId.unknown' }],
    ['Model is required.', { key: 'validation.modelId.required' }],
    ['Model does not exist.', { key: 'validation.modelId.unknown' }],
    ['Model does not belong to the selected manufacturer.', { key: 'validation.modelId.mismatch' }],
    ['Year of manufacture is required.', { key: 'validation.yearOfManufacture.required' }],
    [
      'Year of manufacture must be a whole number from 1950 to 2026.',
      { key: 'validation.yearOfManufacture.range', params: { min: 1950, max: 2026 } },
    ],
    ['Vehicle type is required.', { key: 'validation.type.required' }],
    [
      'Vehicle type must be one of: Unknown, Car, Van, SmallRigidTruck, TractorTrailer.',
      { key: 'validation.type.unknown' },
    ],
    ['Fuel type is required.', { key: 'validation.fuelType.required' }],
    [
      'Fuel type must be one of: Diesel, Petrol, Electric, Hybrid, LPG, Other.',
      { key: 'validation.fuelType.unknown' },
    ],
    ['Fleet is required.', { key: 'validation.fleetId.required' }],
    ['Fleet does not exist.', { key: 'validation.fleetId.unknown' }],
    [
      'Driver ID is required. Send null to leave the vehicle without a driver.',
      { key: 'validation.driverId.required' },
    ],
    ['Driver does not exist.', { key: 'validation.driverId.unknown' }],
  ])('maps "%s"', (message, expected) => {
    expect(translateServerMessage(message)).toEqual(expected)
  })

  it('keeps a message it does not know as plain text', () => {
    expect(translateServerMessage('Plates are on holiday.')).toEqual({
      text: 'Plates are on holiday.',
    })
  })
})

describe('mapServerErrors', () => {
  it('assigns form fields their first message and collects the rest', () => {
    const result = mapServerErrors({
      registrationNumber: ['Registration number is already used by another vehicle.'],
      modelId: ['Model does not belong to the selected manufacturer.', 'Model does not exist.'],
      body: ['Something else is wrong.'],
      name: [],
    })

    expect(result.fieldErrors).toEqual({
      registrationNumber: { key: 'validation.registrationNumber.taken' },
      modelId: { key: 'validation.modelId.mismatch' },
    })
    expect(result.otherMessages).toEqual(['Something else is wrong.'])
  })
})
