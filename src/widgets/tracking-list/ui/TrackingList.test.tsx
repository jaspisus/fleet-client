import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NOW, position, sprinter01, sprinter02, transit05 } from '@/shared/test'
import { TrackingList } from './TrackingList'

const positions = {
  [sprinter01.id]: position(sprinter01.id, { speed: 41 }),
  [sprinter02.id]: position(sprinter02.id, {
    speed: 0,
    lastReportedTime: new Date(NOW - 3 * 86_400_000).toISOString(),
  }),
}

const renderList = (selectedVehicleId: string | null = null) => {
  const onSelect = vi.fn()
  const view = render(
    <TrackingList
      vehicles={[transit05, sprinter02, sprinter01]}
      positions={positions}
      selectedVehicleId={selectedVehicleId}
      now={NOW}
      onSelect={onSelect}
    />,
  )
  return { ...view, onSelect }
}

const item = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}`) })

describe('TrackingList', () => {
  it('lists vehicles by name with their live status', () => {
    renderList()

    const buttons = within(screen.getByRole('list', { name: 'Pojazdy' })).getAllByRole('button')
    expect(buttons.map((button) => button.textContent?.split('GA')[0]?.split('GD')[0])).toEqual([
      'Sprinter 01W ruchu',
      'Sprinter 02Offline',
      'Transit 05Brak sygnału',
    ])
    expect(item('Sprinter 01')).toHaveTextContent('41 km/godz.')
    expect(item('Sprinter 01')).toHaveTextContent('Raport teraz')
    expect(item('Sprinter 02')).toHaveTextContent('Raport 3 dni temu')
    expect(item('Transit 05')).toHaveTextContent('Brak pozycji')
  })

  it('selects a vehicle, and unselects it on a second click', async () => {
    const { onSelect, rerender } = renderList()

    await userEvent.click(item('Sprinter 02'))
    expect(onSelect).toHaveBeenLastCalledWith(sprinter02.id)

    rerender(
      <TrackingList
        vehicles={[sprinter02]}
        positions={positions}
        selectedVehicleId={sprinter02.id}
        now={NOW}
        onSelect={onSelect}
      />,
    )
    await userEvent.click(item('Sprinter 02'))
    expect(onSelect).toHaveBeenLastCalledWith(null)
  })

  it('shows details of the selected vehicle and scrolls it into view', () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    renderList(sprinter01.id)

    expect(item('Sprinter 01')).toHaveAttribute('aria-pressed', 'true')
    const details = item('Sprinter 01').nextElementSibling as HTMLElement
    expect(details).toHaveTextContent('KierowcaAnna Nowak')
    expect(details).toHaveTextContent('FlotaDostawy Gdynia')
    expect(details).toHaveTextContent('Kierunek↑ 152°')
    expect(details).toHaveTextContent('Ostatni raport30 paź 2026, 09:15:55')
    expect(scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ block: 'nearest' }))
  })
})
