import { createSupabaseServer } from '@/lib/supabase/server'
import { CreditTransaction } from '@/lib/types'

interface CreditHistoryProps {
  userId: string
  limit?: number
}

export default async function CreditHistorySimple({ userId, limit = 10 }: CreditHistoryProps) {
  const supabase = await createSupabaseServer()
  
  const query = supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (limit) {
    query.limit(limit)
  }
  
  const { data: transactions, error } = await query

  if (error) {
    return <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-red-500">Error loading transaction history</div>
    </div>
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'grant': return 'bg-green-100 text-green-800'
      case 'usage': return 'bg-red-100 text-red-800'
      case 'adjustment': return 'bg-blue-100 text-blue-800'
      case 'refund': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Credit History</h3>
        <p className="text-sm text-gray-500 mt-1">Your recent credit transactions</p>
      </div>
      
      <div className="p-6">
        {!transactions?.length ? (
          <p className="text-center text-gray-500 py-8">No transactions yet</p>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTransactionColor(transaction.transaction_type)}`}>
                        {transaction.transaction_type}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount} credits
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {transaction.feature_used || 'General transaction'}
                    </p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                {transaction.admin_notes && (
                  <p className="text-xs text-gray-500 mt-1 break-words">
                    Note: {transaction.admin_notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}