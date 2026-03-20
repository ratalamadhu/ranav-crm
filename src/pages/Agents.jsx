import Layout from '../components/layout/Layout'
import { CAN_VIEW_AGENTS } from '../constants/roles'
import RequireAuth from '../components/auth/RequireAuth'

export default function Agents() {
  return (
    <RequireAuth roles={CAN_VIEW_AGENTS}>
      <Layout title="Agents">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-brand-blue">Agents</h2>
            <p className="mt-1 text-gray-400 text-sm">Coming in Phase 6</p>
          </div>
        </div>
      </Layout>
    </RequireAuth>
  )
}
