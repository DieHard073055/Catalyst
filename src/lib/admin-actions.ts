'use server'

import { createSupabaseServer } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function grantCreditsAction(formData: FormData) {
  const userId = formData.get('user_id') as string
  const amount = parseInt(formData.get('amount') as string)
  const notes = formData.get('notes') as string

  if (!userId || !amount || amount <= 0) {
    throw new Error('Invalid input data')
  }

  const supabase = await createSupabaseServer()
  const adminClient = createAdminClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    redirect('/login')
  }

  // Verify current user is admin
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', currentUser.id)
    .single()

  if (!adminUser) {
    throw new Error('Unauthorized: Admin access required')
  }

  // Start transaction: Update user credits and create transaction record
  const { error: creditError } = await supabase.rpc('increment_user_credits', {
    user_id: userId,
    credit_amount: amount
  })

  if (creditError) {
    console.error('Error updating credits:', creditError)
    throw new Error('Failed to update user credits')
  }

  // Create transaction record using admin client to bypass RLS
  const { error: transactionError } = await adminClient
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount: amount,
      transaction_type: 'grant',
      admin_notes: notes || 'Credits granted by admin',
      granted_by: currentUser.id
    })

  if (transactionError) {
    console.error('Error creating transaction record:', transactionError)
    console.error('Transaction data:', { user_id: userId, amount, transaction_type: 'grant', admin_notes: notes || 'Credits granted by admin', granted_by: currentUser.id })
    throw new Error('Failed to create transaction record: ' + transactionError.message)
  }

  console.log('Successfully created transaction record for user:', userId, 'amount:', amount)

  // Force revalidate all relevant paths
  revalidatePath('/admin/users')
  revalidatePath('/admin/credits')
  revalidatePath('/admin')
  revalidatePath('/profile')
  revalidatePath('/dashboard')
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function removeCreditsAction(formData: FormData) {
  const userId = formData.get('user_id') as string
  const amountStr = formData.get('amount') as string
  const notes = formData.get('notes') as string

  console.log('Debug removeCreditsAction inputs:', { userId, amountStr, notes })

  if (!userId || !amountStr || !notes) {
    throw new Error('Missing required fields')
  }

  const amount = parseInt(amountStr)
  
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Amount must be a positive number')
  }

  if (!notes || notes.trim().length === 0) {
    throw new Error('Reason is required when removing credits')
  }

  const supabase = await createSupabaseServer()
  const adminClient = createAdminClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    redirect('/login')
  }

  // Verify current user is admin
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', currentUser.id)
    .single()

  if (!adminUser) {
    throw new Error('Unauthorized: Admin access required')
  }

  // Check if user has enough credits using admin client for fresh data
  const { data: userProfile, error: profileError } = await adminClient
    .from('user_profiles')
    .select('credits')
    .eq('id', userId)
    .single()

  console.log('Debug credit removal - User profile:', userProfile, 'Amount to remove:', amount)

  if (profileError) {
    console.error('Error fetching user profile:', profileError)
    throw new Error('Could not fetch user profile')
  }

  if (!userProfile || userProfile.credits < amount) {
    throw new Error(`User has ${userProfile?.credits || 0} credits but trying to remove ${amount} credits`)
  }

  // Start transaction: Update user credits and create transaction record
  const { error: creditError } = await supabase.rpc('increment_user_credits', {
    user_id: userId,
    credit_amount: -amount // Negative amount to remove credits
  })

  if (creditError) {
    console.error('Error updating credits:', creditError)
    throw new Error('Failed to update user credits')
  }

  // Create transaction record using admin client to bypass RLS
  const { error: transactionError } = await adminClient
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount: -amount, // Negative amount for removal
      transaction_type: 'adjustment',
      admin_notes: notes,
      granted_by: currentUser.id
    })

  if (transactionError) {
    console.error('Error creating transaction record:', transactionError)
    console.error('Transaction data:', { user_id: userId, amount: -amount, transaction_type: 'adjustment', admin_notes: notes, granted_by: currentUser.id })
    throw new Error('Failed to create transaction record: ' + transactionError.message)
  }

  console.log('Successfully removed credits from user:', userId, 'amount:', amount)

  // Force revalidate all relevant paths
  revalidatePath('/admin/users')
  revalidatePath('/admin/credits')
  revalidatePath('/admin')
  revalidatePath('/profile')
  revalidatePath('/dashboard')
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateUserRoleAction(formData: FormData) {
  const userId = formData.get('user_id') as string
  const newRole = formData.get('role') as string

  if (!userId || !newRole || !['free', 'premium', 'admin'].includes(newRole)) {
    throw new Error('Invalid input data')
  }

  const supabase = await createSupabaseServer()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    redirect('/login')
  }

  // Verify current user is admin
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', currentUser.id)
    .single()

  if (!adminUser) {
    throw new Error('Unauthorized: Admin access required')
  }

  // Update user role
  const { error: roleError } = await supabase
    .from('user_profiles')
    .update({ 
      role: newRole,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (roleError) {
    console.error('Error updating role:', roleError)
    throw new Error('Failed to update user role')
  }

  // If promoting to admin, add to admin_users table
  if (newRole === 'admin') {
    const { error: adminError } = await supabase
      .from('admin_users')
      .upsert({
        user_id: userId,
        permissions: ['manage_credits', 'manage_users', 'manage_features']
      }, { onConflict: 'user_id' })

    if (adminError) {
      console.error('Error adding admin permissions:', adminError)
    }
  }

  // If demoting from admin, remove from admin_users table
  if (newRole !== 'admin') {
    const { error: removeAdminError } = await supabase
      .from('admin_users')
      .delete()
      .eq('user_id', userId)

    if (removeAdminError) {
      console.error('Error removing admin permissions:', removeAdminError)
    }
  }

  revalidatePath('/admin/users')
  revalidatePath('/admin')
  return { success: true }
}

export async function toggleFeatureAction(formData: FormData) {
  const featureId = parseInt(formData.get('feature_id') as string)
  const isActive = formData.get('is_active') === 'true'

  if (!featureId) {
    throw new Error('Invalid feature ID')
  }

  const supabase = await createSupabaseServer()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    redirect('/login')
  }

  // Verify current user is admin
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', currentUser.id)
    .single()

  if (!adminUser) {
    throw new Error('Unauthorized: Admin access required')
  }

  // Toggle feature status
  const { error } = await supabase
    .from('features')
    .update({ is_active: !isActive })
    .eq('id', featureId)

  if (error) {
    console.error('Error toggling feature:', error)
    throw new Error('Failed to update feature status')
  }

  revalidatePath('/admin/features')
  revalidatePath('/admin')
  return { success: true }
}