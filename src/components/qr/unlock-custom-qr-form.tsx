'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { unlockCustomQRStudio } from '@/lib/feature-unlock-actions'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface UnlockCustomQRFormProps {
  canUnlock: boolean
  userCredits: number
}

export default function UnlockCustomQRForm({ canUnlock, userCredits }: UnlockCustomQRFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleUnlock = () => {
    startTransition(async () => {
      try {
        setError(null)
        const result = await unlockCustomQRStudio()
        
        if (result.success) {
          // Refresh the page to show unlocked state
          router.refresh()
        }
      } catch (err) {
        console.error('Unlock error:', err)
        setError(err instanceof Error ? err.message : 'Failed to unlock Custom QR Studio')
      }
    })
  }

  if (!canUnlock) {
    return (
      <Button disabled className="w-full">
        Need {5 - userCredits} more credits to unlock
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
      <Button 
        onClick={handleUnlock}
        disabled={isPending}
        className="w-full bg-purple-600 hover:bg-purple-700"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Unlocking...
          </>
        ) : (
          'Unlock Studio (5 credits) →'
        )}
      </Button>
    </div>
  )
}