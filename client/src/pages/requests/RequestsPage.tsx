import axios from 'axios'
import { Eye, Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/common/PageHeader'
import { PaginationControls } from '@/components/common/PaginationControls'
import { ServerDataTable, type ServerTableColumn } from '@/components/common/ServerDataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { getApiErrorMessage } from '@/services/api'
import { committeeService } from '@/services/committeeService'
import { requestService, type RequestListParams } from '@/services/requestService'
import type {
  BorrowingRequestSummary,
  Committee,
  Pagination,
  RequestStatus,
  SortOrder,
} from '@/types/api'

const statuses: RequestStatus[] = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'BORROWED',
  'RETURNED',
]

const emptyPagination: Pagination = { page: 1, limit: 10, total: 0, totalPages: 0 }

function requestTone(status: RequestStatus) {
  if (status === 'REJECTED' || status === 'CANCELLED') return 'danger' as const
  if (status === 'RETURNED') return 'success' as const
  if (status === 'PENDING') return 'pending' as const
  return 'progress' as const
}

export function RequestsPage() {
  const { user } = useAuth()
  const isCommittee = user?.role === 'COMMITTEE'
  const [requests, setRequests] = useState<BorrowingRequestSummary[]>([])
  const [committees, setCommittees] = useState<Committee[]>([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [status, setStatus] = useState('')
  const [committeeId, setCommitteeId] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<RequestListParams['sortBy']>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const requestPromise = requestService.list(
      {
        search: debouncedSearch || undefined,
        status: (status || undefined) as RequestStatus | undefined,
        committeeId: !isCommittee && committeeId ? committeeId : undefined,
        page,
        limit: 10,
        sortBy,
        sortOrder,
      },
      isCommittee,
      controller.signal,
    )
    const committeePromise = isCommittee
      ? Promise.resolve<Committee[]>([])
      : committeeService.list(controller.signal)

    Promise.all([requestPromise, committeePromise])
      .then(([requestResult, committeeResult]) => {
        setRequests(requestResult.requests)
        setPagination(requestResult.pagination)
        setCommittees(committeeResult)
        setError(null)
      })
      .catch((requestError: unknown) => {
        if (!axios.isCancel(requestError)) {
          setError(getApiErrorMessage(requestError, 'Borrowing requests could not be loaded.'))
        }
      })
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [committeeId, debouncedSearch, isCommittee, page, sortBy, sortOrder, status])

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value)
    setPage(1)
    setIsLoading(true)
  }

  const basePath = isCommittee ? '/committee' : '/logistics'
  const columns: ServerTableColumn<BorrowingRequestSummary>[] = [
    {
      key: 'request',
      label: 'Request',
      render: (request) => (
        <div>
          <p className="font-medium">{request.requestCode}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(request.createdAt).toLocaleDateString()}
          </p>
        </div>
      ),
    },
    {
      key: 'requester',
      label: isCommittee ? 'Requester' : 'Committee / Requester',
      render: (request) => (
        <div>
          {!isCommittee ? <p className="font-medium">{request.committee.name}</p> : null}
          <p className="text-xs text-muted-foreground">{request.requesterName}</p>
        </div>
      ),
    },
    {
      key: 'period',
      label: 'Borrow period',
      sortKey: 'borrowDate',
      render: (request) =>
        `${new Date(request.borrowDate).toLocaleDateString()} – ${new Date(request.expectedReturnDate).toLocaleDateString()}`,
    },
    {
      key: 'items',
      label: 'Items',
      render: (request) =>
        request.totalRequestedQuantity
          ? `${request.itemCount} (${request.totalRequestedQuantity} units)`
          : request.itemCount,
    },
    {
      key: 'status',
      label: 'Status',
      sortKey: 'status',
      render: (request) => (
        <StatusBadge label={request.status} tone={requestTone(request.status)} />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (request) => (
        <Button asChild type="button" variant="ghost" size="icon-sm" aria-label={`View request ${request.requestCode}`}>
          <Link to={`${basePath}/requests/${request.id}`}>
            <Eye aria-hidden="true" />
          </Link>
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={isCommittee ? 'My Requests' : 'Borrowing Requests'}
        description={
          isCommittee
            ? 'Track borrowing requests submitted by your committee.'
            : 'Review and process borrowing requests from SITEAO committees.'
        }
        actions={
          isCommittee ? (
            <Button asChild>
              <Link to="/committee/requests/new">
                <Plus aria-hidden="true" />
                New request
              </Link>
            </Button>
          ) : undefined
        }
      />
      <Card className="gap-0 py-0">
        <CardContent className="grid gap-3 border-b p-4 md:grid-cols-[minmax(15rem,1fr)_repeat(2,minmax(10rem,auto))]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={search}
              onChange={(event) => updateFilter(setSearch, event.target.value)}
              placeholder="Search requests…"
              aria-label="Search borrowing requests"
              className="pl-9"
            />
          </div>
          <select
            value={status}
            onChange={(event) => updateFilter(setStatus, event.target.value)}
            aria-label="Filter request status"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All statuses</option>
            {statuses.map((requestStatus) => (
              <option key={requestStatus} value={requestStatus}>{requestStatus}</option>
            ))}
          </select>
          {!isCommittee ? (
            <select
              value={committeeId}
              onChange={(event) => updateFilter(setCommitteeId, event.target.value)}
              aria-label="Filter by committee"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All committees</option>
              {committees.map((committee) => (
                <option key={committee.id} value={committee.id}>{committee.name}</option>
              ))}
            </select>
          ) : null}
        </CardContent>
        <ServerDataTable
          rows={requests}
          columns={columns}
          getRowKey={(request) => request.id}
          isLoading={isLoading}
          error={error}
          emptyTitle="No borrowing requests found"
          emptyDescription="Create a request or change the current filters."
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={(nextSortBy, nextSortOrder) => {
            setSortBy(nextSortBy as RequestListParams['sortBy'])
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
