'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthCallbackHandler() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Handle the OAuth callback
      const { data, error } = await supabase.auth.getSession()
      
      if (data.session && data.session.user) {
        console.log('User authenticated:', data.session.user.email)
        // Force redirect to dashboard
        router.replace('/dashboard')
        router.refresh()
      } else if (error) {
        console.error('Auth error:', error)
      }
    }

    // Check for auth state immediately
    handleAuthCallback()

    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email)
      
      if (event === 'SIGNED_IN' && session) {
        // Small delay to ensure everything is settled
        setTimeout(() => {
          router.replace('/dashboard')
          router.refresh()
        }, 500)
      } else if (event === 'SIGNED_OUT') {
        router.replace('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  return null // This component just handles the logic
}