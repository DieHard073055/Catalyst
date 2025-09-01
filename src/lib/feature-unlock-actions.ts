'use server'

import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function unlockCustomQRStudio() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get current user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Failed to fetch user profile')
  }

  // Check if user already has the unlock
  const { data: existingUnlock } = await supabase
    .from('user_feature_unlocks')
    .select('*')
    .eq('user_id', user.id)
    .eq('feature_name', 'custom_qr_studio')
    .single()

  if (existingUnlock) {
    return { success: true, message: 'Custom QR Studio already unlocked' }
  }

  // Premium and admin users get it for free
  if (profile.role === 'premium' || profile.role === 'admin') {
    const { error: unlockError } = await supabase
      .from('user_feature_unlocks')
      .insert({
        user_id: user.id,
        feature_name: 'custom_qr_studio',
        credits_spent: 0
      })

    if (unlockError) {
      console.error('Error creating unlock record:', unlockError)
      throw new Error('Failed to unlock feature')
    }

    return { success: true, message: 'Custom QR Studio unlocked (Premium/Admin)' }
  }

  // Check if user has enough credits
  if (profile.credits < 5) {
    throw new Error('Insufficient credits. You need 5 credits to unlock Custom QR Studio.')
  }

  try {
    // Start a transaction to deduct credits and add unlock
    const { error: creditError } = await supabase
      .from('user_profiles')
      .update({ credits: profile.credits - 5 })
      .eq('id', user.id)

    if (creditError) {
      console.error('Error deducting credits:', creditError)
      throw new Error('Failed to deduct credits')
    }

    // Add unlock record
    const { error: unlockError } = await supabase
      .from('user_feature_unlocks')
      .insert({
        user_id: user.id,
        feature_name: 'custom_qr_studio',
        credits_spent: 5
      })

    if (unlockError) {
      console.error('Error creating unlock record:', unlockError)
      // Try to refund credits if unlock failed
      await supabase
        .from('user_profiles')
        .update({ credits: profile.credits })
        .eq('id', user.id)
      throw new Error('Failed to unlock feature')
    }

    // Add credit transaction record
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        amount: -5,
        transaction_type: 'usage',
        feature_used: 'Custom QR Studio Unlock',
        admin_notes: 'One-time unlock for Custom QR Studio'
      })

    if (transactionError) {
      console.error('Error recording transaction:', transactionError)
      // Don't fail the unlock if transaction record fails
    }

    return { success: true, message: 'Custom QR Studio unlocked successfully!' }
    
  } catch (error) {
    console.error('Unlock failed:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to unlock Custom QR Studio')
  }
}

export async function checkFeatureUnlock(featureName: string) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  const { data: unlock } = await supabase
    .from('user_feature_unlocks')
    .select('*')
    .eq('user_id', user.id)
    .eq('feature_name', featureName)
    .single()

  return !!unlock
}