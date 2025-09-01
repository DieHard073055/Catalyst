import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            SaaS Marketplace Starter
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A Next.js 15 + Supabase starter template for building SaaS marketplaces
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline">Create Account</Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Role-Based Access</CardTitle>
              <CardDescription>Control access to features based on user roles</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Support for admin, premium, and free user tiers with different permissions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Credit System</CardTitle>
              <CardDescription>Track and manage user credits for feature usage</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Built-in credit system with transaction tracking and admin controls.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Panel</CardTitle>
              <CardDescription>Complete admin interface for user management</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Manage users, grant credits, configure features, and view analytics.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
