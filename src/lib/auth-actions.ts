'use server'

import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function signUpAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  if (!email || !password || !username) {
    return { error: 'All fields are required' }
  }

  const supabase = await createSupabaseServer()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username
      }
    }
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    revalidatePath('/dashboard')
    redirect('/dashboard')
  }

  return { success: true }
}

export async function signInAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createSupabaseServer()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function signOutAction() {
  const supabase = await createSupabaseServer()
  await supabase.auth.signOut()
  revalidatePath('/')
  redirect('/')
}