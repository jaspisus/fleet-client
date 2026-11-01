import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { holdAnimation, NOW, position, sprinter01, sprinter02, transit05 } from '@/shared/test'
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
  const list = (selected: string | null) => (
    <TrackingList
      vehicles={[transit05, sprinter02, sprinter01]}
      positions={positions}
      selectedVehicleId={selected}
      now={NOW}
      onSelect={onSelect}
    />
  )
  const view = render(list(selectedVehicleId))
  return { onSelect, select: (id: string | null) => view.rerender(list(id)) }
}

const item = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}`) })
const detailsPanel = (name: string) => item(name).nextElementSibling as HTMLElement

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

  it('puts the full text of values that may be cut in a tooltip', () => {
    renderList(sprinter01.id)

    expect(within(item('Sprinter 01')).getByTitle('Sprinter 01')).toBeInTheDocument()
    expect(within(item('Sprinter 01')).getByTitle('GA 4K215')).toBeInTheDocument()
    expect(within(item('Sprinter 01')).getByTitle('Raport teraz')).toBeInTheDocument()
    expect(within(detailsPanel('Sprinter 01')).getByTitle('Anna Nowak')).toBeInTheDocument()
    expect(within(detailsPanel('Sprinter 01')).getByTitle('Dostawy Gdynia')).toBeInTheDocument()
  })

  it('selects a vehicle, and unselects it on a second click', async () => {
    const { onSelect, select } = renderList()

    await userEvent.click(item('Sprinter 02'))
    expect(onSelect).toHaveBeenLastCalledWith(sprinter02.id)

    select(sprinter02.id)
    await userEvent.click(item('Sprinter 02'))
    expect(onSelect).toHaveBeenLastCalledWith(null)
  })

  it('shows details of the selected vehicle and scrolls it into view', () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    renderList(sprinter01.id)

    expect(item('Sprinter 01')).toHaveAttribute('aria-pressed', 'true')
    const details = detailsPanel('Sprinter 01')
    expect(details).toHaveTextContent('KierowcaAnna Nowak')
    expect(details).toHaveTextContent('FlotaDostawy Gdynia')
    expect(details).toHaveTextContent('Kierunek↑ 152°')
    expect(details).toHaveTextContent('Ostatni raport30 paź 2026, 09:15:55')
    expect(scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ block: 'nearest' }))
  })

  it('scrolls only once the details have expanded, so all of them are in view', async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    const { select } = renderList()
    const finishExpansion = holdAnimation(detailsPanel('Sprinter 01'))

    select(sprinter01.id)
    expect(detailsPanel('Sprinter 01')).toHaveTextContent('Anna Nowak')
    expect(scrollIntoView).not.toHaveBeenCalled()

    await finishExpansion()
    expect(scrollIntoView).toHaveBeenCalledOnce()
  })

  it('keeps the details until the card has collapsed', async () => {
    const { select } = renderList(sprinter01.id)
    const panel = detailsPanel('Sprinter 01')
    const finishCollapse = holdAnimation(panel)

    select(null)
    expect(item('Sprinter 01')).toHaveAttribute('aria-pressed', 'false')
    expect(panel).toHaveTextContent('Anna Nowak')

    await finishCollapse()
    expect(panel.textContent).toBe('')
  })

  it('collapses the open card on a click on its details', async () => {
    const { onSelect } = renderList(sprinter01.id)

    await userEvent.click(screen.getByText('Anna Nowak'))

    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('keeps the card open when a click ends a text selection', () => {
    const { onSelect } = renderList(sprinter01.id)
    vi.spyOn(window, 'getSelection').mockReturnValue({ toString: () => 'Anna' } as Selection)

    fireEvent.click(screen.getByText('Anna Nowak'))

    expect(onSelect).not.toHaveBeenCalled()
  })
})
