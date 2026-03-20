import Layout from '../components/layout/Layout'
import { CAN_VIEW_REPORTS } from '../constants/roles'
import RequireAuth from '../components/auth/RequireAuth'

export default function Reports() {
  return (
    <RequireAuth roles={CAN_VIEW_REPORTS}>
      <Layout title="Reports">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-brand-blue">Reports</h2>
            <p className="mt-1 text-gray-400 text-sm">Coming in Phase 4</p>
          </div>
        </div>
      </Layout>
    </RequireAuth>
  )
}
