import { createSupabaseServer } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import UserSearchForm from './user-search-form'
import UserActionsForm from './user-actions-form'

interface SearchParams {
  search?: string
  role?: string
}

interface UserManagementTableProps {
  searchParams: SearchParams
}

export default async function UserManagementTable({ searchParams }: UserManagementTableProps) {
  const supabase = await createSupabaseServer()
  const adminClient = createAdminClient()

  // Verify current user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div>Not authenticated</div>

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'admin') {
    return <div>Unauthorized</div>
  }
  
  let query = adminClient
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // Apply search filter
  if (searchParams.search) {
    query = query.ilike('username', `%${searchParams.search}%`)
  }

  // Apply role filter
  if (searchParams.role && searchParams.role !== 'all') {
    query = query.eq('role', searchParams.role)
  }

  const { data: users, error } = await query.limit(50)

  // Get admin users separately
  const { data: adminUsers } = await adminClient
    .from('admin_users')
    .select('user_id, permissions')

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-red-600">Error loading users: {error.message}</div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg min-h-screen" style={{ overflow: 'visible' }}>
      {/* Search and Filters */}
      <div className="p-6 border-b border-gray-100">
        <UserSearchForm currentSearch={searchParams.search} currentRole={searchParams.role} />
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto min-h-96" style={{ overflowY: 'visible' }}>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Credits
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {!users?.length ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isAdmin = adminUsers?.some(admin => admin.user_id === user.id)
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-medium text-sm">
                            {user.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.username || 'No username'}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            ID: {user.id.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                      {isAdmin && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          Admin Access
                        </span>
                      )}
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {user.credits} credits
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <UserActionsForm user={user} />
                  </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {users && users.length >= 50 && (
        <div className="p-6 border-t border-gray-100">
          <div className="text-sm text-gray-500 text-center">
            Showing first 50 users. Use search to find specific users.
          </div>
        </div>
      )}
    </div>
  )
}