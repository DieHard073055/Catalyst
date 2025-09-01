'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.replace('/login?error=auth_failed')
          return
        }

        if (data.session && data.session.user) {
          console.log('Auth successful, redirecting to dashboard...')
          // Successful authentication, redirect to dashboard
          router.replace('/dashboard')
        } else {
          // No session, redirect to login
          router.replace('/login')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        router.replace('/login?error=callback_failed')
      }
    }

    handleAuthCallback()
  }, [router, supabase.auth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}