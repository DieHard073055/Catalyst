import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QRGeneratorForm from '@/components/qr/qr-generator-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function QRGeneratorPage() {
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

  if (!profile) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">← Dashboard</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">QR Code Generator</h1>
              <p className="text-gray-600">Generate QR codes for any text or URL</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Credits: <span className="font-semibold">{profile.credits}</span></p>
            <p className="text-xs text-gray-500">Free feature - no credits required</p>
          </div>
        </div>

        {/* QR Generator */}
        <QRGeneratorForm userProfile={profile} />
      </div>
    </div>
  )
}