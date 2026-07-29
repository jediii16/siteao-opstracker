import axios from 'axios'
import { Eye, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/common/PageHeader'
import { AppSelect } from '@/components/common/AppSelect'
import { PaginationControls } from '@/components/common/PaginationControls'
import { ServerDataTable, type ServerTableColumn } from '@/components/common/ServerDataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { getApiErrorMessage } from '@/services/api'
import { requestService, type HistoryListParams } from '@/services/requestService'
import type {
  BorrowingHistoryRecord,
  Pagination,
  RequestStatus,
  SortOrder,
} from '@/types/api'

const emptyPagination: Pagination = { page: 1, limit: 10, total: 0, totalPages: 0 }

export function BorrowHistoryPage() {
  const [history, setHistory] = useState<BorrowingHistoryRecord[]>([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<HistoryListParams['sortBy']>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    requestService
      .history(
        {
          search: debouncedSearch || undefined,
          status: (status || undefined) as RequestStatus | undefined,
          page,
          limit: 10,
          sortBy,
          sortOrder,
        },
        controller.signal,
      )
      .then((result) => {
        setHistory(result.history)
        setPagination(result.pagination)
        setError(null)
      })
      .catch((requestError: unknown) => {
        if (!axios.isCancel(requestError)) {
          setError(getApiErrorMessage(requestError, 'Borrowing history could not be loaded.'))
        }
      })
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [debouncedSearch, page, sortBy, sortOrder, status])

  const columns: ServerTableColumn<BorrowingHistoryRecord>[] = [
    {
      key: 'request',
      label: 'Request',
      render: (record) => (
        <div>
          <p className="font-medium">{record.requestCode}</p>
          <p className="text-xs text-muted-foreground">{record.requesterName}</p>
        </div>
      ),
    },
    {
      key: 'period',
      label: 'Borrow period',
      sortKey: 'borrowDate',
      render: (record) =>
        `${new Date(record.borrowDate).toLocaleDateString()} – ${new Date(record.expectedReturnDate).toLocaleDateString()}`,
    },
    {
      key: 'items',
      label: 'Items',
      render: (record) => `${record.items.length} item${record.items.length === 1 ? '' : 's'}`,
    },
    {
      key: 'returned',
      label: 'Returned',
      render: (record) => record.returnedAt ? new Date(record.returnedAt).toLocaleDateString() : 'Not returned',
    },
    {
      key: 'status',
      label: 'Status',
      sortKey: 'status',
      render: (record) => (
        <StatusBadge
          label={record.status}
          tone={
            record.status === 'RETURNED'
              ? 'success'
              : record.status === 'REJECTED' || record.status === 'CANCELLED'
                ? 'danger'
                : record.status === 'PENDING'
                  ? 'pending'
                  : 'progress'
          }
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (record) => (
        <Button asChild variant="ghost" size="icon-sm" aria-label={`View request ${record.requestCode}`}>
          <Link to={`/committee/requests/${record.id}`}>
            <Eye aria-hidden="true" />
          </Link>
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Borrowing History"
        description="Review your committee’s completed and current borrowing activity."
      />
      <Card className="gap-0 py-0">
        <CardContent className="grid gap-3 border-b p-4 sm:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
                setIsLoading(true)
              }}
              placeholder="Search borrowing history…"
              aria-label="Search borrowing history"
              className="pl-9"
            />
          </div>
          <AppSelect
            value={status}
            onValueChange={(value) => {
              setStatus(value)
              setPage(1)
              setIsLoading(true)
            }}
            ariaLabel="Filter borrowing history status"
            emptyLabel="All statuses"
            options={(
              ['APPROVED', 'BORROWED', 'RETURNED', 'REJECTED', 'CANCELLED'] as RequestStatus[]
            ).map((value) => ({ value, label: value }))}
          />
        </CardContent>
        <ServerDataTable
          rows={history}
          columns={columns}
          getRowKey={(record) => record.id}
          isLoading={isLoading}
          error={error}
          emptyTitle="No borrowing history found"
          emptyDescription="Completed and active borrowing records will appear here."
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={(nextSortBy, nextSortOrder) => {
            setSortBy(nextSortBy as HistoryListParams['sortBy'])
            setSortOrder(nextSortOrder)
            setPage(1)
            setIsLoading(true)
          }}
        />
        {!error && !isLoading ? (
          <PaginationControls
            pagination={pagination}
            onPageChange={(nextPage) => {
              setPage(nextPage)
              setIsLoading(true)
            }}
          />
        ) : null}
      </Card>
    </div>
  )
}
