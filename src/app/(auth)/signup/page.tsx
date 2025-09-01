'use client'

import { createClient } from '@/lib/supabase/client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function SignUpPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/dashboard')
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <p className="text-gray-600 text-sm">
              Sign up to get started with your SaaS marketplace
            </p>
          </CardHeader>
          <CardContent>
            <Auth
              supabaseClient={supabase}
              view="sign_up"
              appearance={{ 
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#6366f1',
                      brandAccent: '#4f46e5',
                    },
                  },
                },
              }}
              providers={['google']}
              redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : process.env.NODE_ENV === 'production' ? 'https://catalyst-eight-bay.vercel.app/dashboard' : 'http://localhost:3000/dashboard'}
              localization={{
                variables: {
                  sign_up: {
                    email_label: 'Email address',
                    password_label: 'Create a password',
                    button_label: 'Create Account',
                    loading_button_label: 'Creating Account...',
                    link_text: 'Already have an account? Sign in',
                    confirmation_text: 'Check your email for the confirmation link',
                    social_provider_text: 'Sign up with {{provider}}'
                  }
                }
              }}
            />
            
            <div className="mt-4 text-center">
              <Link href="/login" className="text-sm text-blue-600 hover:underline">
                Already have an account? Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}