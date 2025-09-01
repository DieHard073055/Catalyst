import ConditionalAuth from '@/components/auth/conditional-auth'

export default function SignUpPage() {
  return (
    <ConditionalAuth
      view="sign_up"
      title="Create Account"
      description="Sign up to get started with your SaaS marketplace"
      buttonText="Create Account"
      loadingText="Creating Account..."
      linkText="Already have an account? Sign in"
      linkHref="/login"
    />
  )
}