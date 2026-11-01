import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/api'
import { describeSaveError } from './saveError'

describe('describeSaveError', () => {
  it('maps a 400 to field errors with a general hint', () => {
    const error = new ApiError(400, { errors: { name: ['Name is required.'] } })

    expect(describeSaveError(error)).toEqual({
      fieldErrors: { name: { key: 'validation.name.required' } },
      message: { key: 'editVehicle.invalid' },
    })
  })

  it('shows messages about unknown fields as they came', () => {
    const error = new ApiError(400, { errors: { body: ['Body is odd.'] } })

    expect(describeSaveError(error).message).toEqual({ text: 'Body is odd.' })
  })

  it.each([
    ['a 404', new ApiError(404), 'editVehicle.vehicleMissing'],
    ['a network error', ApiError.network(new TypeError()), 'errors.network'],
    ['a 500', new ApiError(500), 'editVehicle.saveFailed'],
    ['a 400 without details (invalid JSON)', new ApiError(400), 'editVehicle.saveFailed'],
    ['an unknown error', new Error('boom'), 'editVehicle.saveFailed'],
  ])('explains %s', (_, error, key) => {
    expect(describeSaveError(error)).toEqual({ fieldErrors: {}, message: { key } })
  })
})
