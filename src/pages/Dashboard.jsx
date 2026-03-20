import Layout from '../components/layout/Layout'

export default function Dashboard() {
  return (
    <Layout title="Dashboard">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-brand-blue">Dashboard</h2>
          <p className="mt-1 text-gray-400 text-sm">Coming in Phase 5</p>
        </div>
      </div>
    </Layout>
  )
}
