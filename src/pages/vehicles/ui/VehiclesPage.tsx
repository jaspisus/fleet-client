import { Outlet, useChildMatches } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { parseSortParam, toSortParam, VehiclesTable } from '@/widgets/vehicles-table'
import { useDocumentTitle } from '@/shared/lib'
import { Container } from '@/shared/ui'
import { useSearchInput } from '../model/useSearchInput'
import styles from './VehiclesPage.module.css'

export interface VehiclesSearch {
  q?: string
  sort?: string
}

interface VehiclesPageProps {
  search: VehiclesSearch
  onSearchChange: (search: VehiclesSearch) => void
}

export const VehiclesPage = ({ search, onSearchChange }: VehiclesPageProps) => {
  const { t } = useTranslation()
  const hasOpenDialog = useChildMatches({ select: (matches) => matches.length > 0 })
  // A child effect runs before its parent's, so the dialog's title would be overwritten.
  useDocumentTitle(t('app.name'), t('vehicles.title'), !hasOpenDialog)

  const [query, changeQuery] = useSearchInput(search.q, (q) => onSearchChange({ ...search, q }))

  return (
    <Container className={styles.page}>
      <VehiclesTable
        query={query}
        sort={parseSortParam(search.sort)}
        onQueryChange={changeQuery}
        onSortChange={(sort) => onSearchChange({ ...search, sort: toSortParam(sort) })}
      />
      <Outlet />
    </Container>
  )
}
