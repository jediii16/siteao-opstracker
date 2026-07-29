import axios from 'axios'
import { ArrowLeft, LoaderCircle, Minus, Plus, Search, Send } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { PageHeader } from '@/components/common/PageHeader'
import { PaginationControls } from '@/components/common/PaginationControls'
import { ServerDataTable, type ServerTableColumn } from '@/components/common/ServerDataTable'
import { InlineError } from '@/components/states/InlineError'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/services/api'
import { itemService, type ItemListParams } from '@/services/itemService'
import { requestService } from '@/services/requestService'
import type { InventoryItem, Pagination, SortOrder } from '@/types/api'

interface SelectedItem {
  item: InventoryItem
  quantity: number
}

const emptyPagination: Pagination = { page: 1, limit: 10, total: 0, totalPages: 0 }

export function CreateRequestPage() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [inventorySearch, setInventorySearch] = useState('')
  const debouncedSearch = useDebouncedValue(inventorySearch)
  const [inventoryPagination, setInventoryPagination] = useState(emptyPagination)
  const [inventoryPage, setInventoryPage] = useState(1)
  const [inventorySortBy, setInventorySortBy] =
    useState<ItemListParams['sortBy']>('itemName')
  const [inventorySortOrder, setInventorySortOrder] = useState<SortOrder>('asc')
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [requesterName, setRequesterName] = useState('')
  const [requesterPosition, setRequesterPosition] = useState('')
  const [purpose, setPurpose] = useState('')
  const [borrowDate, setBorrowDate] = useState('')
  const [expectedReturnDate, setExpectedReturnDate] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [isLoadingItems, setIsLoadingItems] = useState(true)
  const [inventoryError, setInventoryError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    itemService
      .list(
        {
          search: debouncedSearch || undefined,
          isActive: true,
          availableOnly: true,
          page: inventoryPage,
          limit: 10,
          sortBy: inventorySortBy,
          sortOrder: inventorySortOrder,
        },
        controller.signal,
      )
      .then((result) => {
        setInventory(result.items)
        setInventoryPagination(result.pagination)
        setInventoryError(null)
      })
      .catch((requestError: unknown) => {
        if (!axios.isCancel(requestError)) {
          setInventoryError(getApiErrorMessage(requestError, 'Available inventory could not be loaded.'))
        }
      })
      .finally(() => setIsLoadingItems(false))

    return () => controller.abort()
  }, [debouncedSearch, inventoryPage, inventorySortBy, inventorySortOrder])

  function addItem(item: InventoryItem) {
    if (selectedItems.some((selection) => selection.item.id === item.id)) {
      return
    }
    setSelectedItems((current) => [...current, { item, quantity: 1 }])
  }

  function removeItem(itemId: string) {
    setSelectedItems((current) => current.filter((selection) => selection.item.id !== itemId))
  }

  function updateQuantity(itemId: string, quantity: number) {
    setSelectedItems((current) =>
      current.map((selection) =>
        selection.item.id === itemId
          ? {
              ...selection,
              quantity: Math.max(1, Math.min(quantity, selection.item.availableQuantity)),
            }
          : selection,
      ),
    )
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    if (
      requesterName.trim().length < 2 ||
      requesterPosition.trim().length < 2 ||
      purpose.trim().length < 5 ||
      !borrowDate ||
      !expectedReturnDate ||
      expectedReturnDate < borrowDate ||
      selectedItems.length === 0
    ) {
      setFormError('Complete the request details, select at least one item, and check the dates.')
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      const response = await requestService.create({
        requesterName: requesterName.trim(),
        requesterPosition: requesterPosition.trim(),
        purpose: purpose.trim(),
        borrowDate,
        expectedReturnDate,
        additionalNotes: additionalNotes.trim() || null,
        items: selectedItems.map((selection) => ({
          itemId: selection.item.id,
          quantity: selection.quantity,
        })),
      })
      notify({ title: response.message ?? 'Borrow request submitted.' })
      navigate(`/committee/requests/${response.data.request.id}`, { replace: true })
    } catch (submitError) {
      const message = getApiErrorMessage(submitError, 'Borrowing request could not be submitted.')
      setFormError(message)
      notify({ title: 'Borrow request was not submitted.', description: message, tone: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const inventoryColumns: ServerTableColumn<InventoryItem>[] = [
    {
      key: 'item',
      label: 'Item',
      sortKey: 'itemName',
      render: (item) => (
        <div>
          <p className="font-medium">{item.itemName}</p>
          <p className="text-xs text-muted-foreground">{item.itemCode} · {item.category.name}</p>
        </div>
      ),
    },
    {
      key: 'available',
      label: 'Available',
      sortKey: 'availableQuantity',
      render: (item) => item.availableQuantity,
    },
    {
      key: 'action',
      label: 'Action',
      className: 'text-right',
      render: (item) => {
        const selected = selectedItems.some((selection) => selection.item.id === item.id)
        return (
          <Button type="button" variant="outline" size="sm" onClick={() => addItem(item)} disabled={selected}>
            <Plus aria-hidden="true" />
            {selected ? 'Added' : 'Add'}
          </Button>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Borrowing Request"
        description="Select available SITEAO inventory and provide the accountable requester details."
        actions={
          <Button asChild variant="outline">
            <Link to="/committee/requests/history">
              <ArrowLeft aria-hidden="true" />
              Back to requests
            </Link>
          </Button>
        }
      />
      <form onSubmit={submitRequest} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Requester and schedule</CardTitle></CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            {formError ? <div className="md:col-span-2"><InlineError message={formError} /></div> : null}
            <div className="space-y-2">
              <Label htmlFor="requester-name">Requester name *</Label>
              <Input id="requester-name" value={requesterName} onChange={(event) => setRequesterName(event.target.value)} disabled={isSubmitting} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requester-position">Position *</Label>
              <Input id="requester-position" value={requesterPosition} onChange={(event) => setRequesterPosition(event.target.value)} disabled={isSubmitting} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="borrow-date">Borrow date *</Label>
              <Input id="borrow-date" type="date" value={borrowDate} onChange={(event) => setBorrowDate(event.target.value)} disabled={isSubmitting} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="return-date">Expected return date *</Label>
              <Input id="return-date" type="date" min={borrowDate || undefined} value={expectedReturnDate} onChange={(event) => setExpectedReturnDate(event.target.value)} disabled={isSubmitting} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="request-purpose">Purpose *</Label>
              <textarea id="request-purpose" value={purpose} onChange={(event) => setPurpose(event.target.value)} disabled={isSubmitting} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="request-notes">Additional notes</Label>
              <textarea id="request-notes" value={additionalNotes} onChange={(event) => setAdditionalNotes(event.target.value)} disabled={isSubmitting} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="gap-0 py-0">
          <CardHeader className="border-b py-5">
            <CardTitle>Available inventory</CardTitle>
          </CardHeader>
          <CardContent className="border-b p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={inventorySearch}
                onChange={(event) => {
                  setInventorySearch(event.target.value)
                  setInventoryPage(1)
                  setIsLoadingItems(true)
                }}
                placeholder="Search available inventory…"
                aria-label="Search available inventory"
                className="pl-9"
              />
            </div>
          </CardContent>
          <ServerDataTable
            rows={inventory}
            columns={inventoryColumns}
            getRowKey={(item) => item.id}
            isLoading={isLoadingItems}
            error={inventoryError}
            emptyTitle="No available inventory"
            emptyDescription="Try a different search or check back later."
            sortBy={inventorySortBy}
            sortOrder={inventorySortOrder}
            onSort={(nextSortBy, nextSortOrder) => {
              setInventorySortBy(nextSortBy as ItemListParams['sortBy'])
              setInventorySortOrder(nextSortOrder)
              setInventoryPage(1)
              setIsLoadingItems(true)
            }}
          />
          {!inventoryError && !isLoadingItems ? (
            <PaginationControls
              pagination={inventoryPagination}
              onPageChange={(nextPage) => {
                setInventoryPage(nextPage)
                setIsLoadingItems(true)
              }}
            />
          ) : null}
        </Card>
        <Card>
          <CardHeader><CardTitle>Selected items ({selectedItems.length})</CardTitle></CardHeader>
          <CardContent>
            {selectedItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add at least one item from the inventory table.</p>
            ) : (
              <div className="space-y-3">
                {selectedItems.map((selection) => (
                  <div key={selection.item.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{selection.item.itemName}</p>
                      <p className="text-xs text-muted-foreground">{selection.item.itemCode} · {selection.item.availableQuantity} available</p>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      max={selection.item.availableQuantity}
                      value={selection.quantity}
                      onChange={(event) => updateQuantity(selection.item.id, Number(event.target.value))}
                      className="w-24"
                      aria-label={`Quantity for ${selection.item.itemName}`}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(selection.item.id)} aria-label={`Remove ${selection.item.itemName}`}>
                      <Minus aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-end border-t pt-6">
            <Button type="submit" disabled={isSubmitting || selectedItems.length === 0}>
              {isSubmitting ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
              {isSubmitting ? 'Submitting…' : 'Submit request'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
