import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { VehicleType } from '../model/types'
import tractorTrailerIcon from './icons/tractorTrailer.svg'
import unknownIcon from './icons/unknown.svg'
import { VehicleTypeIcon } from './VehicleTypeIcon'

describe('VehicleTypeIcon', () => {
  it('is an image labelled with the translated type, masked with the type icon', () => {
    render(<VehicleTypeIcon type="TractorTrailer" />)

    const icon = screen.getByRole('img', { name: 'Ciągnik z naczepą' })
    expect(icon).toHaveAttribute('title', 'Ciągnik z naczepą')
    expect(icon.style.maskImage).toBe(`url("${tractorTrailerIcon}")`)
  })

  it('shows the unknown icon and the raw value for a type the app does not know', () => {
    render(<VehicleTypeIcon type={'Bus' as VehicleType} />)

    const icon = screen.getByRole('img', { name: 'Bus' })
    expect(icon.style.maskImage).toBe(`url("${unknownIcon}")`)
  })
})
