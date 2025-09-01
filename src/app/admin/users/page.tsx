import { createSupabaseServer } from '@/lib/supabase/server'
import UserManagementTable from '@/components/admin/user-management-table'
import { Suspense } from 'react'

interface SearchParams {
  search?: string
  role?: string
}

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const resolvedSearchParams = await searchParams
  return (
    <div className="space-y-6 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <div className="text-sm text-gray-500">
          Manage users, roles, and permissions
        </div>
      </div>

      <Suspense fallback={
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      }>
        <UserManagementTable searchParams={resolvedSearchParams} />
      </Suspense>
    </div>
  )
}