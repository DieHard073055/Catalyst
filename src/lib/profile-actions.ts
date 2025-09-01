'use server'

import { createSupabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateProfileAction(formData: FormData) {
  const username = formData.get('username') as string
  const avatar_url = formData.get('avatar_url') as string

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const updateData: any = {
    updated_at: new Date().toISOString()
  }

  if (username) {
    updateData.username = username
  }
  
  if (avatar_url) {
    updateData.avatar_url = avatar_url
  }

  const { error } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('id', user.id)

  if (error) {
    console.error('Profile update error:', error)
    throw new Error('Failed to update profile')
  }

  revalidatePath('/dashboard')
  return { success: true }
}