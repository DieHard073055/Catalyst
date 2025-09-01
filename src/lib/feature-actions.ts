'use server'

import { createSupabaseServer } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function useFeatureAction(formData: FormData) {
  const featureId = parseInt(formData.get('feature_id') as string)
  
  if (!featureId || isNaN(featureId)) {
    throw new Error('Invalid feature ID')
  }

  const supabase = await createSupabaseServer()
  const adminClient = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile and feature details in parallel
  const [
    { data: userProfile, error: profileError },
    { data: feature, error: featureError }
  ] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    supabase
      .from('features')
      .select('*')
      .eq('id', featureId)
      .eq('is_active', true)
      .single()
  ])

  if (profileError || !userProfile) {
    throw new Error('Could not fetch user profile')
  }

  if (featureError || !feature) {
    throw new Error('Feature not found or not active')
  }

  // Check role requirements
  if (feature.required_role === 'premium' && userProfile.role === 'free') {
    throw new Error('This feature requires a Premium account')
  }
  
  if (feature.required_role === 'admin' && userProfile.role !== 'admin') {
    throw new Error('This feature requires Admin access')
  }

  // Check credit requirements
  if (feature.credit_cost > userProfile.credits) {
    throw new Error(`Insufficient credits. This feature costs ${feature.credit_cost} credits but you only have ${userProfile.credits}`)
  }

  // Deduct credits if needed
  if (feature.credit_cost > 0) {
    const { error: creditError } = await supabase.rpc('increment_user_credits', {
      user_id: user.id,
      credit_amount: -feature.credit_cost
    })

    if (creditError) {
      console.error('Error deducting credits:', creditError)
      throw new Error('Failed to deduct credits for feature usage')
    }

    // Create transaction record using admin client
    const { error: transactionError } = await adminClient
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        amount: -feature.credit_cost,
        transaction_type: 'usage',
        feature_used: feature.name,
        admin_notes: `Used feature: ${feature.name}`
      })

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError)
      console.error('Transaction data:', { 
        user_id: user.id, 
        amount: -feature.credit_cost, 
        transaction_type: 'usage', 
        feature_used: feature.name 
      })
      // Don't throw here since credits were already deducted
    } else {
      console.log('Successfully created transaction record for feature usage')
    }
  }

  console.log(`User ${user.id} successfully used feature: ${feature.name}`)

  // Revalidate relevant paths
  revalidatePath('/dashboard')
  revalidatePath('/profile')

  return { 
    success: true, 
    message: `Successfully used ${feature.name}${feature.credit_cost > 0 ? ` (${feature.credit_cost} credits deducted)` : ''}` 
  }
}