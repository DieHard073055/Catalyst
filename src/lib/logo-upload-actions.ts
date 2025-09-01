'use server'

import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'

export async function uploadLogoAction(formData: FormData) {
  const file = formData.get('logo') as File
  
  if (!file || file.size === 0) {
    throw new Error('No file provided')
  }

  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload PNG, JPG, GIF, SVG, or WebP images.')
  }

  // Validate file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File too large. Please upload an image smaller than 5MB.')
  }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${uuidv4()}.${fileExt}`
    
    // Convert File to ArrayBuffer for upload
    const fileArrayBuffer = await file.arrayBuffer()
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('temp-logos')
      .upload(fileName, fileArrayBuffer, {
        contentType: file.type,
        cacheControl: '86400', // 24 hours cache
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      throw new Error('Failed to upload logo: ' + error.message)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('temp-logos')
      .getPublicUrl(fileName)

    console.log('Logo uploaded successfully:', publicUrl)
    
    // Convert uploaded file to data URL for canvas compatibility
    const dataUrl = `data:${file.type};base64,${Buffer.from(fileArrayBuffer).toString('base64')}`
    
    return { 
      success: true, 
      url: dataUrl, // Use data URL instead of public URL for canvas compatibility
      publicUrl: publicUrl, // Keep public URL for reference
      fileName: fileName
    }
    
  } catch (error) {
    console.error('Logo upload failed:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to upload logo')
  }
}

export async function deleteLogoAction(fileName: string) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  try {
    // Only allow deleting files uploaded by the same user
    if (!fileName.startsWith(user.id + '/')) {
      throw new Error('Unauthorized: Cannot delete this file')
    }

    const { error } = await supabase.storage
      .from('temp-logos')
      .remove([fileName])

    if (error) {
      console.error('Storage delete error:', error)
      throw new Error('Failed to delete logo: ' + error.message)
    }

    return { success: true }
    
  } catch (error) {
    console.error('Logo delete failed:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to delete logo')
  }
}