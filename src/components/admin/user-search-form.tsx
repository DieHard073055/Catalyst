'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface UserSearchFormProps {
  currentSearch?: string
  currentRole?: string
}

export default function UserSearchForm({ currentSearch = '', currentRole = 'all' }: UserSearchFormProps) {
  const router = useRouter()
  const [search, setSearch] = useState(currentSearch)
  const [role, setRole] = useState(currentRole)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (role && role !== 'all') params.set('role', role)
    
    const queryString = params.toString()
    router.push(`/admin/users${queryString ? `?${queryString}` : ''}`)
  }

  const handleReset = () => {
    setSearch('')
    setRole('all')
    router.push('/admin/users')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search by username or user ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>
      
      <div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="premium">Premium</option>
          <option value="free">Free</option>
        </select>
      </div>
      
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          Search
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Reset
        </button>
      </div>
    </form>
  )
}