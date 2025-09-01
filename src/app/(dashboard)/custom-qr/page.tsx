import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CustomQRGeneratorForm from '@/components/qr/custom-qr-generator-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { unlockCustomQRStudio, checkFeatureUnlock } from '@/lib/feature-unlock-actions'
import UnlockCustomQRForm from '@/components/qr/unlock-custom-qr-form'

export default async function CustomQRGeneratorPage() {
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

  // Check if user has unlocked Custom QR Studio
  const hasUnlocked = await checkFeatureUnlock('custom_qr_studio')
  const isPremiumOrAdmin = profile.role === 'premium' || profile.role === 'admin'
  const canUnlock = profile.credits >= 5 || isPremiumOrAdmin

  // Auto-unlock for premium/admin users
  if (isPremiumOrAdmin && !hasUnlocked) {
    await unlockCustomQRStudio()
  }

  if (!hasUnlocked && !isPremiumOrAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">← Dashboard</Button>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Custom QR Styles</h1>
            </div>
          </div>

          <div className="max-w-md mx-auto bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Custom QR Studio</h2>
            <p className="text-gray-600 mb-6">
              Unlock advanced styling, gradients, logos, and custom shapes. One-time payment of 5 credits for unlimited access.
            </p>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Your account: <Badge variant="outline">{profile.role}</Badge>
              </p>
              <p className="text-sm text-gray-500">
                Your credits: <Badge variant="outline">{profile.credits}</Badge>
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <UnlockCustomQRForm canUnlock={canUnlock} userCredits={profile.credits} />
              <Link href="/dashboard" className="block">
                <Button variant="outline" className="w-full">Back to Dashboard</Button>
              </Link>
              <Link href="/qr-generator" className="block">
                <Button variant="outline" className="w-full">Use Basic QR Generator</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
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
              <h1 className="text-3xl font-bold text-gray-900">Custom QR Styles</h1>
              <p className="text-gray-600">Create beautiful, branded QR codes</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Credits: <span className="font-semibold">{profile.credits}</span></p>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-500 text-white">Studio Unlocked</Badge>
              <span className="text-xs text-gray-500">Unlimited generations</span>
            </div>
          </div>
        </div>

        {/* Custom QR Generator */}
        <CustomQRGeneratorForm userProfile={profile} />
      </div>
    </div>
  )
}