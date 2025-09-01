import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOutAction } from '@/lib/auth-actions'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('user_id, permissions')
    .eq('user_id', user.id)
    .single()

  if (!adminUser) {
    redirect('/dashboard')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('username, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
                </div>
              </div>
              
              <nav className="hidden md:flex space-x-6">
                <Link href="/admin" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/admin/users" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Users
                </Link>
                <Link href="/admin/credits" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Credits
                </Link>
                <Link href="/admin/features" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Features
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.username || 'Admin'}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <div className="flex space-x-2">
                <Link 
                  href="/dashboard"
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  User View
                </Link>
                <form action={signOutAction} className="inline">
                  <button
                    type="submit"
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Content */}
      <main className="container mx-auto px-4 py-6 min-h-screen">
        {children}
      </main>
    </div>
  )
}