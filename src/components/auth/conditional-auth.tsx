'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useEffect } from 'react'

interface ConditionalAuthProps {
  view: 'sign_up' | 'sign_in'
  title: string
  description: string
  buttonText: string
  loadingText: string
  linkText: string
  linkHref: string
}

export default function ConditionalAuth({ 
  view, 
  title, 
  description, 
  buttonText, 
  loadingText, 
  linkText, 
  linkHref 
}: ConditionalAuthProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const isProduction = process.env.NODE_ENV === 'production'

  useEffect(() => {
    if (isProduction) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          router.push('/dashboard')
          router.refresh()
        }
      })
      return () => subscription.unsubscribe()
    }
  }, [router, supabase.auth, isProduction])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const username = formData.get('username') as string

    try {
      if (view === 'sign_up') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
            }
          }
        })

        if (error) {
          setMessage({ type: 'error', text: error.message })
        } else if (data.user && !data.user.email_confirmed_at) {
          setMessage({ 
            type: 'success', 
            text: 'Account created successfully! You can now sign in.' 
          })
        } else {
          router.push('/dashboard')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) {
          setMessage({ type: 'error', text: error.message })
        } else if (data.user) {
          router.push('/dashboard')
          router.refresh()
        }
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Authentication failed' 
      })
    } finally {
      setLoading(false)
    }
  }

  // Production: Use Supabase Auth UI
  if (isProduction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{title}</CardTitle>
              <p className="text-gray-600 text-sm">{description}</p>
            </CardHeader>
            <CardContent>
              <Auth
                supabaseClient={supabase}
                view={view}
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
                redirectTo="https://catalyst-eight-bay.vercel.app/dashboard"
                localization={{
                  variables: {
                    [view]: {
                      email_label: 'Email address',
                      password_label: view === 'sign_up' ? 'Create a password' : 'Password',
                      button_label: buttonText,
                      loading_button_label: loadingText,
                      link_text: linkText,
                      confirmation_text: 'Check your email for the confirmation link',
                      social_provider_text: `${view === 'sign_up' ? 'Sign up' : 'Sign in'} with {{provider}}`
                    }
                  }
                }}
              />
              
              <div className="mt-4 text-center">
                <Link href={linkHref} className="text-sm text-blue-600 hover:underline">
                  {linkText}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Development: Use custom form (works with local Supabase)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'sign_up' && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Choose a username"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={view === 'sign_up' ? 'Create a password (min 6 characters)' : 'Enter your password'}
                minLength={6}
                required
              />
            </div>
            
            {message && (
              <div className={`p-3 rounded-md text-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? loadingText : buttonText}
            </Button>
            <div className="text-center text-sm">
              <Link href={linkHref} className="text-blue-600 hover:underline">
                {linkText}
              </Link>
            </div>
            
            <div className="mt-4 p-2 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-600 text-center">
                🔧 Development Mode: Using local Supabase setup
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}