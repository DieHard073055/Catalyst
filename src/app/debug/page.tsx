import { createSupabaseServer } from '@/lib/supabase/server'

export default async function DebugPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>Not logged in</div>
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get admin status
  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Get transactions
  const { data: transactions, error: transError } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', user.id)
    .limit(5)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Debug Info</h1>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold">Auth User:</h2>
        <pre className="text-sm">{JSON.stringify(user, null, 2)}</pre>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold">User Profile:</h2>
        {profileError ? (
          <p className="text-red-600">Error: {profileError.message}</p>
        ) : (
          <pre className="text-sm">{JSON.stringify(profile, null, 2)}</pre>
        )}
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold">Admin Status:</h2>
        {adminError ? (
          <p className="text-red-600">Error: {adminError.message}</p>
        ) : (
          <pre className="text-sm">{JSON.stringify(adminUser, null, 2)}</pre>
        )}
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold">Transactions:</h2>
        {transError ? (
          <p className="text-red-600">Error: {transError.message}</p>
        ) : (
          <pre className="text-sm">{JSON.stringify(transactions, null, 2)}</pre>
        )}
      </div>
    </div>
  )
}