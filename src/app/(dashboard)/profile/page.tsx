import { Suspense } from 'react'
import { createSupabaseServer } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { signOutAction } from '@/lib/auth-actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProfileBasic from '@/components/dashboard/profile-basic'
import CreditHistorySimple from '@/components/dashboard/credit-history-simple'
import { ProfileSkeleton, CreditHistorySkeleton } from '@/components/dashboard/loading-skeletons'

export default async function ProfilePage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">← Dashboard</Button>
            </Link>
            <h1 className="text-3xl font-bold">Profile</h1>
          </div>
          <form action={signOutAction}>
            <Button variant="outline" type="submit">
              Sign Out
            </Button>
          </form>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Profile Settings */}
          <div className="lg:col-span-2">
            <Suspense fallback={<ProfileSkeleton />}>
              {profile && <ProfileBasic profile={profile} userEmail={user.email!} />}
            </Suspense>
          </div>

          {/* Credit History */}
          <div>
            <Suspense fallback={<CreditHistorySkeleton />}>
              <CreditHistorySimple userId={user.id} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}