import { createSupabaseServer } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminDashboard() {
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

  // Test admin client first
  const testQuery = await adminClient.from('credit_transactions').select('*').limit(1)
  console.log('Test query result:', testQuery)

  // Get recent transactions first
  const recentTransactionsResult = await adminClient
    .from('credit_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  console.log('Direct transaction query:', recentTransactionsResult)

  // Get overview stats using admin client
  const [
    { count: totalUsers },
    { count: totalTransactions },
    { count: activeFeatures }
  ] = await Promise.all([
    adminClient.from('user_profiles').select('*', { count: 'exact', head: true }),
    adminClient.from('credit_transactions').select('*', { count: 'exact', head: true }),
    adminClient.from('features').select('*', { count: 'exact', head: true }).eq('is_active', true)
  ])

  console.log('Recent transactions debug:', {
    data: recentTransactionsResult.data,
    error: recentTransactionsResult.error,
    count: recentTransactionsResult.data?.length
  })

  console.log('Admin client config:', {
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
  })

  const recentTransactions = recentTransactionsResult.data

  // Get user profiles for transaction display
  const { data: userProfiles } = await adminClient
    .from('user_profiles')
    .select('id, username, role')

  // Get user stats by role using admin client
  const { data: userStats } = await adminClient
    .from('user_profiles')
    .select('role')

  const roleStats = userStats?.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="text-sm text-gray-500">
          Welcome to the admin panel
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{totalUsers || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-3xl font-bold text-gray-900">{totalTransactions || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 font-bold">💳</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Features</p>
              <p className="text-3xl font-bold text-gray-900">{activeFeatures || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-bold">⚡</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Admin Users</p>
              <p className="text-3xl font-bold text-gray-900">{roleStats.admin || 0}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 font-bold">👑</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">User Distribution</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(roleStats).map(([role, count]) => (
                <div key={role} className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      role === 'admin' ? 'bg-red-100 text-red-800' :
                      role === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {role}
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          </div>
          <div className="p-6">
            {!recentTransactions?.length ? (
              <div className="text-center text-gray-500 py-4">
                <p>No recent transactions</p>
                <p className="text-xs mt-1">Total transactions in system: {totalTransactions || 0}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => {
                  const userProfile = userProfiles?.find(p => p.id === transaction.user_id)
                  return (
                    <div key={transaction.id} className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.transaction_type === 'grant' ? 'bg-green-100 text-green-800' :
                            transaction.transaction_type === 'usage' ? 'bg-red-100 text-red-800' :
                            transaction.transaction_type === 'adjustment' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {transaction.transaction_type}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {userProfile?.username || 'Unknown user'}
                        </p>
                        {transaction.feature_used && (
                          <p className="text-xs text-gray-500">
                            Feature: {transaction.feature_used}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.created_at).toLocaleDateString('en-US')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}