import { Suspense } from 'react'
import { createSupabaseServer } from '@/lib/supabase/server'
import { signOutAction } from '@/lib/auth-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import FeaturesList from '@/components/dashboard/features-list'
import CreditHistorySimple from '@/components/dashboard/credit-history-simple'
import ProfileBasic from '@/components/dashboard/profile-basic'
import { FeaturesListSkeleton, CreditHistorySkeleton, ProfileSkeleton } from '@/components/dashboard/loading-skeletons'
import { checkFeatureUnlock } from '@/lib/feature-unlock-actions'

export default async function DashboardPage() {
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

  // Check if user has unlocked Custom QR Studio
  const hasUnlockedCustomQR = await checkFeatureUnlock('custom_qr_studio')

  // Removed unused function getRoleBadge

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-600 text-white">
              Admin
            </span>
          </div>
          <form action={signOutAction}>
            <Button variant="outline" type="submit">
              Sign Out
            </Button>
          </form>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Credits
                <Badge variant="outline" className="font-mono text-lg">
                  {profile?.credits || 0}
                </Badge>
              </CardTitle>
              <CardDescription>Available credits for features</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
              <CardDescription>
                {profile?.role === 'admin' ? 'Administrator access' : 
                 profile?.role === 'premium' ? 'Premium member' : 
                 'Free account'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                <span className="text-sm text-green-600">Active</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Member Since</CardTitle>
              <CardDescription>
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* QR Code Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>QR Code Generator</CardTitle>
            <CardDescription>Create and customize QR codes for your needs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Simple QR Generator - Always Free */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    📱 Simple QR Generator
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">FREE</Badge>
                  </CardTitle>
                  <CardDescription>
                    Generate basic black and white QR codes instantly. No credits required.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/qr-generator">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Start Creating →
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Custom QR Studio - One-time unlock */}
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    🎨 Custom QR Studio
                    <Badge variant="default" className="bg-purple-500 hover:bg-purple-600 text-white">
                      5 CREDITS
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Unlock advanced styling, gradients, logos, and custom shapes. Generate unlimited custom QR codes once unlocked.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {hasUnlockedCustomQR || profile?.role === 'premium' || profile?.role === 'admin' ? (
                    <Link href="/custom-qr">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700">
                        Access Studio →
                      </Button>
                    </Link>
                  ) : profile?.credits >= 5 ? (
                    <Link href="/custom-qr">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700">
                        Unlock Studio (5 credits) →
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled className="w-full">
                      Need {5 - (profile?.credits || 0)} more credits
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
            <CardDescription>Jump to other tools and settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/profile">
                <Button variant="outline" className="flex items-center gap-2">
                  👤 Profile Settings
                </Button>
              </Link>
              {profile?.role === 'admin' && (
                <Link href="/admin">
                  <Button variant="outline" className="flex items-center gap-2">
                    ⚙️ Admin Panel
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Features Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Available Features</h2>
            <Suspense fallback={<FeaturesListSkeleton />}>
              {profile && <FeaturesList userProfile={profile} />}
            </Suspense>
          </section>

          {/* Profile and History */}
          <div className="grid gap-8 lg:grid-cols-2">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Profile Settings</h2>
              <Suspense fallback={<ProfileSkeleton />}>
                {profile && <ProfileBasic profile={profile} userEmail={user.email!} />}
              </Suspense>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
              <Suspense fallback={<CreditHistorySkeleton />}>
                <CreditHistorySimple userId={user.id} limit={5} />
              </Suspense>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}