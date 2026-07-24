import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import type { ReactNode } from 'react'

import { EmptyState } from '@/components/common/EmptyState'
import { InlineError } from '@/components/states/InlineError'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { SortOrder } from '@/types/api'

export interface ServerTableColumn<T> {
  key: string
  label: string
  render: (row: T) => ReactNode
  sortKey?: string
  className?: string
}

interface ServerDataTableProps<T> {
  rows: T[]
  columns: ServerTableColumn<T>[]
  getRowKey: (row: T) => string
  isLoading: boolean
  error: string | null
  emptyTitle: string
  emptyDescription: string
  emptyAction?: ReactNode
  sortBy?: string
  sortOrder?: SortOrder
  onSort?: (sortBy: string, sortOrder: SortOrder) => void
  onRetry?: () => void
  tableClassName?: string
}

export function ServerDataTable<T>({
  rows,
  columns,
  getRowKey,
  isLoading,
  error,
  emptyTitle,
  emptyDescription,
  emptyAction,
  sortBy,
  sortOrder,
  onSort,
  onRetry,
  tableClassName,
}: ServerDataTableProps<T>) {
  if (error) {
    return (
      <div className="p-4">
        <InlineError
          message={error}
          action={
            onRetry ? (
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                Retry
              </Button>
            ) : undefined
          }
        />
      </div>
    )
  }

  if (!isLoading && rows.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    )
  }

  return (
    <Table className={tableClassName}>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.key} className={column.className}>
              {column.sortKey && onSort ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="-ml-2"
                  onClick={() =>
                    onSort(
                      column.sortKey!,
                      sortBy === column.sortKey && sortOrder === 'asc' ? 'desc' : 'asc',
                    )
                  }
                >
                  {column.label}
                  {sortBy !== column.sortKey ? (
                    <ArrowUpDown aria-hidden="true" />
                  ) : sortOrder === 'asc' ? (
                    <ArrowUp aria-hidden="true" />
                  ) : (
                    <ArrowDown aria-hidden="true" />
                  )}
                </Button>
              ) : (
                column.label
              )}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading
          ? Array.from({ length: 5 }, (_, rowIndex) => (
              <TableRow key={`loading-${rowIndex}`}>
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    <Skeleton className="h-5 w-full max-w-32" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : rows.map((row) => (
              <TableRow key={getRowKey(row)}>
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
      </TableBody>
    </Table>
  )
}
