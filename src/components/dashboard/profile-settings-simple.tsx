'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { UserProfile } from '@/lib/types'
import { updateProfileAction } from '@/lib/profile-actions'

interface ProfileSettingsProps {
  profile: UserProfile
  userEmail: string
}

export default function ProfileSettingsSimple({ profile, userEmail }: ProfileSettingsProps) {
  const [isLoading, setIsLoading] = useState(false)

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

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return <Badge className="bg-purple-600 text-white">Admin</Badge>
    }
    if (role === 'premium') {
      return <Badge className="bg-yellow-600 text-white">Premium</Badge>
    }
    return <Badge variant="secondary">Free</Badge>
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Manage your account information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Info Display */}
        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-purple-700">
              {profile.username ? profile.username.substring(0, 2).toUpperCase() : 'U'}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-semibold">{profile.username || 'No username set'}</h3>
              {getRoleBadge(profile.role)}
            </div>
            <p className="text-sm text-gray-600">{userEmail}</p>
            <p className="text-sm text-gray-600">Credits: <strong>{profile.credits}</strong></p>
          </div>
        </div>

        {/* Edit Form */}
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </Label>
            <Input
              id="username"
              name="username"
              type="text"
              defaultValue={profile.username || ''}
              placeholder="Enter your username"
              className="w-full"
            />
          </div>

          <div>
            <Label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700 mb-2">
              Avatar URL (optional)
            </Label>
            <Input
              id="avatar_url"
              name="avatar_url"
              type="url"
              defaultValue={profile.avatar_url || ''}
              placeholder="https://example.com/avatar.jpg"
              className="w-full"
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Account Information</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Member since:</span>
                <span>{new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Last updated:</span>
                <span>{new Date(profile.updated_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Account role:</span>
                <span className="capitalize">{profile.role}</span>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Updating...' : 'Update Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}