import { createSupabaseServer } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function CreditTransactionHistory() {
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
  
  // Use admin client to get all transactions
  const { data: transactions, error } = await adminClient
    .from('credit_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  // Get user profiles separately
  const { data: userProfiles } = await adminClient
    .from('user_profiles')
    .select('id, username, role')

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-red-600">Error loading transactions: {error.message}</div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        <p className="text-sm text-gray-500 mt-1">Latest 50 credit transactions across all users</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Feature
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Granted By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {!transactions?.length ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No transactions found
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => {
                const userProfile = userProfiles?.find(p => p.id === transaction.user_id)
                const grantedByProfile = transaction.granted_by ? userProfiles?.find(p => p.id === transaction.granted_by) : null
                
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-medium text-xs">
                            {userProfile?.username 
                              ? userProfile.username.substring(0, 2).toUpperCase() 
                              : 'U'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {userProfile?.username || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {userProfile?.role || 'free'}
                          </p>
                        </div>
                      </div>
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.transaction_type === 'grant' ? 'bg-green-100 text-green-800' :
                      transaction.transaction_type === 'usage' ? 'bg-red-100 text-red-800' :
                      transaction.transaction_type === 'refund' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {transaction.transaction_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-medium ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.feature_used || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {grantedByProfile?.username || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      {new Date(transaction.created_at).toLocaleDateString()}
                      <div className="text-xs text-gray-400">
                        {new Date(transaction.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}