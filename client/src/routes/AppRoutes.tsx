import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AuthLayout } from '@/layouts/AuthLayout'
import { CommitteeLayout } from '@/layouts/CommitteeLayout'
import { LogisticsLayout } from '@/layouts/LogisticsLayout'
import { AuditLogsPage } from '@/pages/audit/AuditLogsPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { CategoriesPage } from '@/pages/categories/CategoriesPage'
import { CommitteeAccountsPage } from '@/pages/committees/CommitteeAccountsPage'
import { CommitteeDashboardPage } from '@/pages/dashboard/CommitteeDashboardPage'
import { LogisticsDashboardPage } from '@/pages/dashboard/LogisticsDashboardPage'
import { InventoryPage } from '@/pages/inventory/InventoryPage'
import { ItemDetailsPage } from '@/pages/inventory/ItemDetailsPage'
import { ItemFormPage } from '@/pages/inventory/ItemFormPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { CreateRequestPage } from '@/pages/requests/CreateRequestPage'
import { RequestDetailsPage } from '@/pages/requests/RequestDetailsPage'
import { RequestsPage } from '@/pages/requests/RequestsPage'
import { TransactionsPage } from '@/pages/transactions/TransactionsPage'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { RoleRoute } from '@/routes/RoleRoute'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route index element={<LoginPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute />}>
            <Route path="/logistics" element={<LogisticsLayout />}>
              <Route path="dashboard" element={<LogisticsDashboardPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="inventory/new" element={<ItemFormPage />} />
              <Route path="inventory/:itemId" element={<ItemDetailsPage />} />
              <Route path="inventory/:itemId/edit" element={<ItemFormPage />} />
              <Route path="requests" element={<RequestsPage />} />
              <Route path="requests/new" element={<CreateRequestPage />} />
              <Route path="requests/:requestId" element={<RequestDetailsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="committees" element={<CommitteeAccountsPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
            </Route>
          </Route>
          <Route element={<RoleRoute />}>
            <Route path="/committee" element={<CommitteeLayout />}>
              <Route path="dashboard" element={<CommitteeDashboardPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="requests/new" element={<CreateRequestPage />} />
              <Route path="requests/history" element={<RequestsPage />} />
              <Route path="requests/:requestId" element={<RequestDetailsPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
