import { describe, expect, it } from 'vitest'
import { sprinter01, transit05 } from '@/shared/test'
import { isVehicleFormField, toFormValues, toUpdateCommand } from './formValues'

describe('toFormValues', () => {
  it('flattens a vehicle into form fields', () => {
    expect(toFormValues(sprinter01)).toEqual({
      name: 'Sprinter 01',
      registrationNumber: 'GA 4K215',
      manufacturerId: 'make-mercedes',
      modelId: 'model-sprinter',
      yearOfManufacture: '2021',
      type: 'Van',
      fuelType: 'Diesel',
      fleetId: 'fleet-gdynia',
      driverId: 'driver-nowak',
    })
  })

  it('uses an empty driver for a vehicle without one', () => {
    expect(toFormValues(transit05).driverId).toBe('')
  })
})

describe('toUpdateCommand', () => {
  it('trims text, parses the year and sends null for "no driver"', () => {
    const values = {
      ...toFormValues(sprinter01),
      name: '  Sprinter 01 – chłodnia ',
      registrationNumber: ' GA 4K215 ',
      yearOfManufacture: ' 2024 ',
      driverId: '',
    }

    expect(toUpdateCommand(values)).toEqual({
      name: 'Sprinter 01 – chłodnia',
      registrationNumber: 'GA 4K215',
      manufacturerId: 'make-mercedes',
      modelId: 'model-sprinter',
      yearOfManufacture: 2024,
      type: 'Van',
      fuelType: 'Diesel',
      fleetId: 'fleet-gdynia',
      driverId: null,
    })
  })

  it('round-trips an unchanged vehicle', () => {
    const command = toUpdateCommand(toFormValues(sprinter01))
    expect(command.driverId).toBe('driver-nowak')
    expect(command.yearOfManufacture).toBe(2021)
  })
})

describe('isVehicleFormField', () => {
  it('recognises request body fields', () => {
    expect(isVehicleFormField('registrationNumber')).toBe(true)
    expect(isVehicleFormField('id')).toBe(false)
  })
})
