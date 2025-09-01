'use client'

import { useState } from 'react'
import { toggleFeatureAction } from '@/lib/admin-actions'

interface FeatureToggleProps {
  feature: {
    id: number
    name: string
    is_active: boolean
  }
}

export default function FeatureToggle({ feature }: FeatureToggleProps) {
  const [isToggling, setIsToggling] = useState(false)

  const handleToggle = async () => {
    setIsToggling(true)
    try {
      const formData = new FormData()
      formData.append('feature_id', feature.id.toString())
      formData.append('is_active', feature.is_active.toString())
      await toggleFeatureAction(formData)
    } catch (error) {
      console.error('Error toggling feature:', error)
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isToggling}
      className={`px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 ${
        feature.is_active 
          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
          : 'bg-green-100 text-green-700 hover:bg-green-200'
      }`}
    >
      {isToggling 
        ? 'Updating...' 
        : feature.is_active 
          ? 'Disable' 
          : 'Enable'
      }
    </button>
  )
}