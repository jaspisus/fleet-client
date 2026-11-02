import { describe, expect, it } from 'vitest'
import { sprinter01 } from '@/shared/test'
import { formatMakeModel } from './makeModel'

describe('formatMakeModel', () => {
  it('joins the manufacturer and model names', () => {
    expect(formatMakeModel(sprinter01)).toBe(
      `${sprinter01.manufacturer.name} ${sprinter01.model.name}`,
    )
    expect(
      formatMakeModel({
        manufacturer: { id: 'm', name: 'Ford' },
        model: { id: 'x', name: 'Transit' },
      }),
    ).toBe('Ford Transit')
  })
})
