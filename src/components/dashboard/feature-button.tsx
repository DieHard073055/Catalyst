'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Feature } from '@/lib/types'
import Link from 'next/link'

interface FeatureButtonProps {
  feature: Feature
  canUse: boolean
  userCredits: number
}

export default function FeatureButton({ feature, canUse }: FeatureButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleButtonClick = () => {
    if (feature.credit_cost > 0) {
      setShowConfirmation(true)
    } else {
      // If free feature, use directly
      handleUseFeature()
    }
  }

  const handleConfirmUse = () => {
    setShowConfirmation(false)
    handleUseFeature()
  }

  const handleUseFeature = () => {
    startTransition(() => {
      // For now, just show a success message
      // TODO: Implement actual feature usage logic when needed
      setMessage('Feature used successfully!')
      setTimeout(() => setMessage(''), 3000)
    })
  }

  // Special handling for QR features - direct links instead of credit deduction in dashboard
  if (feature.name === 'Simple QR Generator' && canUse) {
    return (
      <div className="space-y-2">
        <Link href="/qr-generator">
          <Button className="w-full">
            Open QR Generator
          </Button>
        </Link>
      </div>
    )
  }

  if (feature.name === 'Custom QR Studio' && canUse) {
    return (
      <div className="space-y-2">
        <Link href="/custom-qr">
          <Button className="w-full">
            Open Custom QR Studio
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Button 
        onClick={handleButtonClick}
        className="w-full" 
        disabled={!canUse || isPending}
        variant={canUse ? 'default' : 'outline'}
      >
        {isPending ? 'Using...' : (canUse ? 'Use Feature' : 'Unavailable')}
      </Button>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm Feature Usage
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to use <strong>{feature.name}</strong>?
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-yellow-600 text-sm font-medium">
                    ⚠️ This will deduct <strong>{feature.credit_cost} credit{feature.credit_cost !== 1 ? 's' : ''}</strong> from your account
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={() => setShowConfirmation(false)}
                variant="outline" 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmUse}
                className="flex-1"
                disabled={isPending}
              >
                {isPending ? 'Using...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`text-sm p-2 rounded ${
          message.includes('successfully') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}