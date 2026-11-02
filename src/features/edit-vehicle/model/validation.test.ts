import { describe, expect, it } from 'vitest'
import { dictionaries, drivers, fleets, sprinter01, vehicles } from '@/shared/test'
import { toFormValues, type VehicleFormValues } from './formValues'
import { validateVehicleForm, type ValidationContext } from './validation'

const context: ValidationContext = {
  vehicleId: sprinter01.id,
  vehicles,
  dictionaries,
  fleets,
  drivers,
  currentYear: 2026,
}

const validate = (changes: Partial<VehicleFormValues>) =>
  validateVehicleForm({ ...toFormValues(sprinter01), ...changes }, context)

describe('validateVehicleForm', () => {
  it('accepts an unchanged vehicle', () => {
    expect(validate({})).toEqual({})
  })

  describe('name', () => {
    it.each([
      ['', { key: 'validation.name.required' }],
      ['   ', { key: 'validation.name.required' }],
      ['A', { key: 'validation.name.length', params: { min: 2, max: 60 } }],
      ['x'.repeat(61), { key: 'validation.name.length', params: { min: 2, max: 60 } }],
    ])('rejects %j', (name, error) => {
      expect(validate({ name }).name).toEqual(error)
    })

    it('measures the trimmed name', () => {
      expect(validate({ name: '  Ab  ' }).name).toBeUndefined()
      expect(validate({ name: 'x'.repeat(60) }).name).toBeUndefined()
    })
  })

  describe('registrationNumber', () => {
    it('is required', () => {
      expect(validate({ registrationNumber: ' ' }).registrationNumber).toEqual({
        key: 'validation.registrationNumber.required',
      })
    })

    it('allows at most 50 characters', () => {
      expect(validate({ registrationNumber: 'X'.repeat(51) }).registrationNumber).toEqual({
        key: 'validation.registrationNumber.tooLong',
        params: { max: 50 },
      })
    })

    it('must not belong to another vehicle, ignoring spaces and case', () => {
      expect(validate({ registrationNumber: 'ga7m302' }).registrationNumber).toEqual({
        key: 'validation.registrationNumber.taken',
      })
    })

    it('may keep its own value', () => {
      expect(validate({ registrationNumber: 'ga4k215' }).registrationNumber).toBeUndefined()
    })
  })

  describe('manufacturer and model', () => {
    it('requires both', () => {
      const errors = validate({ manufacturerId: '', modelId: '' })
      expect(errors.manufacturerId).toEqual({ key: 'validation.manufacturerId.required' })
      expect(errors.modelId).toEqual({ key: 'validation.modelId.required' })
    })

    it('rejects unknown IDs', () => {
      const errors = validate({ manufacturerId: 'make-unknown', modelId: 'model-unknown' })
      expect(errors.manufacturerId).toEqual({ key: 'validation.manufacturerId.unknown' })
      expect(errors.modelId).toEqual({ key: 'validation.modelId.unknown' })
    })

    it('rejects a model of another manufacturer', () => {
      expect(validate({ modelId: 'model-transit' }).modelId).toEqual({
        key: 'validation.modelId.mismatch',
      })
    })

    it('reports only the manufacturer when that is what is wrong', () => {
      const errors = validate({ manufacturerId: 'make-unknown' })
      expect(errors.manufacturerId).toEqual({ key: 'validation.manufacturerId.unknown' })
      expect(errors.modelId).toBeUndefined()
    })
  })

  describe('yearOfManufacture', () => {
    const range = { key: 'validation.yearOfManufacture.range', params: { min: 1950, max: 2026 } }

    it('is required', () => {
      expect(validate({ yearOfManufacture: '' }).yearOfManufacture).toEqual({
        key: 'validation.yearOfManufacture.required',
      })
    })

    it.each(['1949', '2027', '20.5', '2O20', '-2000'])('rejects %s', (yearOfManufacture) => {
      expect(validate({ yearOfManufacture }).yearOfManufacture).toEqual(range)
    })

    it.each(['1950', '2026', ' 2000 '])('accepts %s', (yearOfManufacture) => {
      expect(validate({ yearOfManufacture }).yearOfManufacture).toBeUndefined()
    })
  })

  it('rejects types missing from the dictionaries', () => {
    const errors = validateVehicleForm(toFormValues(sprinter01), {
      ...context,
      dictionaries: { ...dictionaries, vehicleType: ['Car'], fuelType: ['Petrol'] },
    })
    expect(errors.type).toEqual({ key: 'validation.type.unknown' })
    expect(errors.fuelType).toEqual({ key: 'validation.fuelType.unknown' })
  })

  it('requires an existing fleet', () => {
    expect(validate({ fleetId: '' }).fleetId).toEqual({ key: 'validation.fleetId.required' })
    expect(validate({ fleetId: 'fleet-x' }).fleetId).toEqual({ key: 'validation.fleetId.unknown' })
  })

  it('allows no driver, but not an unknown one', () => {
    expect(validate({ driverId: '' }).driverId).toBeUndefined()
    expect(validate({ driverId: 'driver-x' }).driverId).toEqual({
      key: 'validation.driverId.unknown',
    })
  })
})
