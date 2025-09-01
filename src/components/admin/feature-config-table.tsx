import { createSupabaseServer } from '@/lib/supabase/server'
import FeatureToggle from './feature-toggle'

export default async function FeatureConfigTable() {
  const supabase = await createSupabaseServer()
  
  const { data: features, error } = await supabase
    .from('features')
    .select('*')
    .order('id')

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-red-600">Error loading features: {error.message}</div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Feature
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Required Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Credit Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {!features?.length ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No features found
                </td>
              </tr>
            ) : (
              features.map((feature) => (
                <tr key={feature.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {feature.name}
                      </div>
                      <div className="text-sm text-gray-500 max-w-xs">
                        {feature.description || 'No description'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      feature.required_role === 'admin' ? 'bg-red-100 text-red-800' :
                      feature.required_role === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {feature.required_role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {feature.credit_cost > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {feature.credit_cost} credits
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">Free</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      feature.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {feature.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <FeatureToggle feature={feature} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-6 border-t border-gray-100">
        <div className="text-sm text-gray-600">
          <p className="mb-2"><strong>Role Requirements:</strong></p>
          <ul className="space-y-1 text-xs">
            <li>• <strong>Free:</strong> Available to all users</li>
            <li>• <strong>Premium:</strong> Requires premium or admin role</li>
            <li>• <strong>Admin:</strong> Admin access only</li>
          </ul>
        </div>
      </div>
    </div>
  )
}