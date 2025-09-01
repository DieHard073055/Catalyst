import { createSupabaseServer } from '@/lib/supabase/server'
import FeatureConfigTable from '@/components/admin/feature-config-table'

export default async function AdminFeaturesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Feature Management</h1>
        <div className="text-sm text-gray-500">
          Configure available features and access requirements
        </div>
      </div>

      <FeatureConfigTable />
    </div>
  )
}