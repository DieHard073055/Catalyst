'use client'

import { useState } from 'react'
import { grantCreditsAction, removeCreditsAction, updateUserRoleAction } from '@/lib/admin-actions'

interface UserActionsFormProps {
  user: {
    id: string
    username: string | null
    role: string
    credits: number
  }
}

export default function UserActionsForm({ user }: UserActionsFormProps) {
  const [isGrantingCredits, setIsGrantingCredits] = useState(false)
  const [isRemovingCredits, setIsRemovingCredits] = useState(false)
  const [isChangingRole, setIsChangingRole] = useState(false)
  const [showCreditForm, setShowCreditForm] = useState(false)
  const [showRemoveCreditForm, setShowRemoveCreditForm] = useState(false)
  const [showRoleForm, setShowRoleForm] = useState(false)

  const handleGrantCredits = async (formData: FormData) => {
    setIsGrantingCredits(true)
    try {
      await grantCreditsAction(formData)
      setShowCreditForm(false)
    } catch (error) {
      console.error('Error granting credits:', error)
    } finally {
      setIsGrantingCredits(false)
    }
  }

  const handleRemoveCredits = async (formData: FormData) => {
    setIsRemovingCredits(true)
    try {
      await removeCreditsAction(formData)
      setShowRemoveCreditForm(false)
    } catch (error) {
      console.error('Error removing credits:', error)
    } finally {
      setIsRemovingCredits(false)
    }
  }

  const handleRoleChange = async (formData: FormData) => {
    setIsChangingRole(true)
    try {
      await updateUserRoleAction(formData)
      setShowRoleForm(false)
    } catch (error) {
      console.error('Error updating role:', error)
    } finally {
      setIsChangingRole(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Grant Credits Button */}
      <div className="relative">
        <button
          onClick={() => setShowCreditForm(!showCreditForm)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Grant Credits
        </button>
        
        {showCreditForm && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <form action={handleGrantCredits} className="p-4">
              <input type="hidden" name="user_id" value={user.id} />
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    name="amount"
                    min="1"
                    max="1000"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter credits to grant"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <input
                    type="text"
                    name="notes"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Reason for granting credits"
                  />
                </div>
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setShowCreditForm(false)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGrantingCredits}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isGrantingCredits ? 'Granting...' : 'Grant'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Remove Credits Button */}
      <div className="relative">
        <button
          onClick={() => setShowRemoveCreditForm(!showRemoveCreditForm)}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Remove Credits
        </button>
        
        {showRemoveCreditForm && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <form action={handleRemoveCredits} className="p-4">
              <input type="hidden" name="user_id" value={user.id} />
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount to Remove
                  </label>
                  <input
                    type="number"
                    name="amount"
                    min="1"
                    max={user.credits}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder={`Max: ${user.credits} credits`}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    User currently has {user.credits} credits
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason (required)
                  </label>
                  <input
                    type="text"
                    name="notes"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Reason for removing credits"
                  />
                </div>
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setShowRemoveCreditForm(false)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRemovingCredits}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    {isRemovingCredits ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Change Role Button */}
      <div className="relative">
        <button
          onClick={() => setShowRoleForm(!showRoleForm)}
          className="text-sm text-purple-600 hover:text-purple-800 font-medium"
        >
          Change Role
        </button>
        
        {showRoleForm && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <form action={handleRoleChange} className="p-4">
              <input type="hidden" name="user_id" value={user.id} />
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Role
                  </label>
                  <select
                    name="role"
                    defaultValue={user.role}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setShowRoleForm(false)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingRole}
                    className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isChangingRole ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}