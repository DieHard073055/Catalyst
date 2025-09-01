import { createSupabaseServer } from '@/lib/supabase/server'

export default async function AdminTestPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div className="p-6">Not logged in</div>
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get admin status
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Test Page</h1>
      
      <div className="bg-white border p-4 rounded mb-4">
        <h2 className="font-bold">User Info:</h2>
        <p>Email: {user.email}</p>
        <p>ID: {user.id}</p>
      </div>

      <div className="bg-white border p-4 rounded mb-4">
        <h2 className="font-bold">Profile Info:</h2>
        <p>Username: {profile?.username}</p>
        <p>Role: {profile?.role}</p>
        <p>Credits: {profile?.credits}</p>
      </div>

      <div className="bg-white border p-4 rounded mb-4">
        <h2 className="font-bold">Admin Status:</h2>
        <p>Is Admin: {adminUser ? 'Yes' : 'No'}</p>
        <p>Permissions: {adminUser?.permissions?.join(', ') || 'None'}</p>
      </div>

      {profile?.role === 'admin' && adminUser ? (
        <div className="bg-green-100 p-4 rounded">
          <p className="text-green-800">✅ You should be able to access /admin</p>
        </div>
      ) : (
        <div className="bg-red-100 p-4 rounded">
          <p className="text-red-800">❌ Admin access not properly configured</p>
        </div>
      )}
    </div>
  )
}