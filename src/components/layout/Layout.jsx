import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, UserCheck, BarChart2 } from 'lucide-react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useAuthContext } from '../../context/AuthContext'
import { CAN_VIEW_AGENTS, CAN_VIEW_REPORTS } from '../../constants/roles'

const BOTTOM_NAV = [
  { to: '/dashboard', label: 'Home',    icon: LayoutDashboard, roles: null },
  { to: '/leads',     label: 'Leads',   icon: Users,           roles: null },
  { to: '/agents',    label: 'Team',    icon: UserCheck,       roles: CAN_VIEW_AGENTS },
  { to: '/reports',   label: 'Reports', icon: BarChart2,       roles: CAN_VIEW_REPORTS },
]

export default function Layout({ title, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profile } = useAuthContext()
  const role = profile?.role

  const visibleBottomNav = BOTTOM_NAV.filter(item =>
    !item.roles || item.roles.includes(role)
  )

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ── Desktop sidebar ─────────────────── */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* ── Mobile sidebar overlay ──────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full z-50 shadow-2xl">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Main content ────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar title={title} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-6 page-fade">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom tab bar ───────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-t border-gray-100 flex">
        {visibleBottomNav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors cursor-pointer ${
                isActive ? 'text-brand-blue' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-brand-blue/10' : ''}`}>
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
