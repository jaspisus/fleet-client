import { Outlet } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { parseSortParam, toSortParam, VehiclesTable } from '@/widgets/vehicles-table'
import { useDocumentTitle } from '@/shared/lib'
import { Container } from '@/shared/ui'
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
  useDocumentTitle(t('app.name'), t('vehicles.title'))
  // The input keeps its own state: URL updates are asynchronous, and typing must not lag behind.
  // The URL only seeds it, which is enough because searching replaces the history entry.
  const [query, setQuery] = useState(search.q ?? '')

  const changeQuery = (value: string) => {
    setQuery(value)
    onSearchChange({ ...search, q: value || undefined })
  }

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
