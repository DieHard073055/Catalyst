'use server'

import { createSupabaseServer } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function trackQRGenerationAction(formData: FormData) {
  const contentLength = parseInt(formData.get('content_length') as string) || 0
  const qrType = formData.get('qr_type') as string || 'text'
  
  const supabase = await createSupabaseServer()
  const adminClient = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  try {
    // Create a usage record for analytics (no credits deducted since it's free)
    const { error: transactionError } = await adminClient
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        amount: 0, // Free feature
        transaction_type: 'usage',
        feature_used: 'QR Code Generator',
        admin_notes: `Generated QR code: ${qrType}, ${contentLength} chars`
      })

    if (transactionError) {
      console.error('Error tracking QR generation:', transactionError)
      // Don't throw - this is just for analytics
    }

    console.log(`User ${user.id} generated QR code: ${qrType}`)
    
    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath('/profile')

    return { success: true }
  } catch (error) {
    console.error('QR tracking error:', error)
    return { success: true } // Don't fail the user experience for tracking issues
  }
}