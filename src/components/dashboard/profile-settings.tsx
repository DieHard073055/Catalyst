'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { UserProfile } from '@/lib/types'
import { updateProfileAction } from '@/lib/profile-actions'

interface ProfileSettingsProps {
  profile: UserProfile
  userEmail: string
}

export default function ProfileSettings({ profile, userEmail }: ProfileSettingsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [optimisticProfile, setOptimisticProfile] = useState(profile)

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    
    // Optimistic update
    const newUsername = formData.get('username') as string
    const newAvatarUrl = formData.get('avatar_url') as string
    
    setOptimisticProfile(prev => ({
      ...prev,
      username: newUsername || prev.username,
      avatar_url: newAvatarUrl || prev.avatar_url
    }))
    
    try {
      await updateProfileAction(formData)
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticProfile(profile)
      console.error('Profile update failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default" className="bg-purple-500 hover:bg-purple-600 text-white">Admin</Badge>
      case 'premium':
        return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-white">Premium</Badge>
      case 'free':
        return <Badge variant="secondary">Free</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Manage your account information</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={optimisticProfile.avatar_url || undefined} />
              <AvatarFallback className="text-lg font-semibold">
                {optimisticProfile.username 
                  ? optimisticProfile.username.slice(0, 2).toUpperCase()
                  : userEmail.slice(0, 2).toUpperCase()
                }
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium">{optimisticProfile.username || 'No username'}</h3>
                {getRoleBadge(optimisticProfile.role)}
              </div>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Credits:</span>
                <Badge variant="outline" className="font-mono">
                  {optimisticProfile.credits}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="username" className="text-sm font-medium">Username</Label>
              <Input
                id="username"
                name="username"
                defaultValue={optimisticProfile.username || ''}
                placeholder="Enter your username"
                className="h-10"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="avatar_url" className="text-sm font-medium">Avatar URL</Label>
              <Input
                id="avatar_url"
                name="avatar_url"
                defaultValue={optimisticProfile.avatar_url || ''}
                placeholder="https://example.com/avatar.jpg"
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Account Information</Label>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span>Member since:</span>
                <span>{new Date(optimisticProfile.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Last updated:</span>
                <span>{new Date(optimisticProfile.updated_at).toLocaleDateString()}</span>
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