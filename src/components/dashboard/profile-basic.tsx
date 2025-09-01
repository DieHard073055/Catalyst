'use client'

import { useState, useEffect } from 'react'
import { UserProfile } from '@/lib/types'
import { updateProfileAction } from '@/lib/profile-actions'

interface ProfileBasicProps {
  profile: UserProfile
  userEmail: string
}

export default function ProfileBasic({ profile, userEmail }: ProfileBasicProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    try {
      await updateProfileAction(formData)
    } catch (error) {
      console.error('Profile update failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Profile Settings</h3>
        <p className="text-sm text-gray-500 mt-1">Manage your account information</p>
      </div>
      
      <div className="p-6">
        {/* User Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">
                {profile.username ? profile.username.substring(0, 2).toUpperCase() : 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="mb-3">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {profile.username || 'No username set'}
                </h4>
                <div className="mb-2">
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-purple-600 text-white">
                    {profile.role.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600 break-words">{userEmail}</p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Credits:</span> 
                    <span className="ml-1 inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      {profile.credits}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form action={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                defaultValue={profile.username || ''}
                placeholder="Enter your username"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700 mb-2">
                Avatar URL (optional)
              </label>
              <input
                id="avatar_url"
                name="avatar_url"
                type="url"
                defaultValue={profile.avatar_url || ''}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Account Information</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Member since:</span>
                  <span className="text-gray-900">
                    {isMounted ? new Date(profile.created_at).toLocaleDateString('en-US') : '...'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last updated:</span>
                  <span className="text-gray-900">
                    {isMounted ? new Date(profile.updated_at).toLocaleDateString('en-US') : '...'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account role:</span>
                  <span className="text-gray-900 capitalize">{profile.role}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}