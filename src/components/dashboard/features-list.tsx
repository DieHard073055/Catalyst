import { createSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Feature, UserProfile } from '@/lib/types'
import FeatureButton from './feature-button'

interface FeaturesListProps {
  userProfile: UserProfile
}

export default async function FeaturesList({ userProfile }: FeaturesListProps) {
  const supabase = await createSupabaseServer()
  
  const { data: features, error } = await supabase
    .from('features')
    .select('*')
    .eq('is_active', true)
    .order('id')

  if (error) {
    console.error('Error fetching features:', error)
    return <div className="text-red-500">Error loading features</div>
  }

  const canAccessFeature = (feature: Feature): boolean => {
    // Check role requirement
    if (feature.required_role === 'premium' && userProfile.role === 'free') {
      return false
    }
    if (feature.required_role === 'admin' && userProfile.role !== 'admin') {
      return false
    }
    
    // Check credit requirement
    if (feature.credit_cost > userProfile.credits) {
      return false
    }
    
    return true
  }

  const getAccessStatus = (feature: Feature): { status: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
    if (!canAccessFeature(feature)) {
      if (feature.required_role === 'premium' && userProfile.role === 'free') {
        return { status: 'Requires Premium', variant: 'destructive' }
      }
      if (feature.required_role === 'admin' && userProfile.role !== 'admin') {
        return { status: 'Admin Only', variant: 'destructive' }
      }
      if (feature.credit_cost > userProfile.credits) {
        return { status: 'Insufficient Credits', variant: 'outline' }
      }
    }
    return { status: 'Available', variant: 'default' }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {features?.map((feature) => {
        const access = getAccessStatus(feature)
        const canUse = canAccessFeature(feature)
        
        return (
          <Card key={feature.id} className={canUse ? '' : 'opacity-60'}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{feature.name}</CardTitle>
                <Badge variant={access.variant}>
                  {access.status}
                </Badge>
              </div>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Required Role:</span>
                  <span className="capitalize font-medium">{feature.required_role}</span>
                </div>
                {feature.credit_cost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Credit Cost:</span>
                    <span className="font-medium">{feature.credit_cost} credits</span>
                  </div>
                )}
                <div className="pt-2">
                  <FeatureButton feature={feature} canUse={canUse} userCredits={userProfile.credits} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}