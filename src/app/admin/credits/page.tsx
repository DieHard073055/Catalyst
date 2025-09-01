import { createSupabaseServer } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import CreditTransactionHistory from '@/components/admin/credit-transaction-history'

export default async function AdminCreditsPage() {
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

  // Get credit statistics using admin client
  const [
    { data: totalTransactions },
    { data: creditsGranted },
    { data: creditsUsed },
    { data: totalCreditsInSystem }
  ] = await Promise.all([
    adminClient.from('credit_transactions').select('amount'),
    adminClient.from('credit_transactions').select('amount').eq('transaction_type', 'grant'),
    adminClient.from('credit_transactions').select('amount').eq('transaction_type', 'usage'),
    adminClient.from('user_profiles').select('credits')
  ])

  const stats = {
    totalTransactions: totalTransactions?.length || 0,
    totalGranted: creditsGranted?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0,
    totalUsed: Math.abs(creditsUsed?.reduce((sum, t) => sum + t.amount, 0)) || 0,
    totalInCirculation: totalCreditsInSystem?.reduce((sum, u) => sum + u.credits, 0) || 0
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Credit Management</h1>
        <div className="text-sm text-gray-500">
          Monitor and manage user credits
        </div>
      </div>

      {/* Credit Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalTransactions}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Credits Granted</p>
              <p className="text-3xl font-bold text-green-600">+{stats.totalGranted}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 font-bold">📈</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Credits Used</p>
              <p className="text-3xl font-bold text-red-600">{stats.totalUsed}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 font-bold">📉</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Circulation</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalInCirculation}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-bold">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <CreditTransactionHistory />
    </div>
  )
}