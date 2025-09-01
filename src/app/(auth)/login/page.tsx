import ConditionalAuth from '@/components/auth/conditional-auth'

export default function LoginPage() {
  return (
    <ConditionalAuth
      view="sign_in"
      title="Sign In"
      description="Enter your credentials to access your account"
      buttonText="Sign In"
      loadingText="Signing In..."
      linkText="Don't have an account? Sign up"
      linkHref="/signup"
    />
  )
}