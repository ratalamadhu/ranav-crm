import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, UserCheck, BarChart2, LogOut, X
} from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { CAN_VIEW_AGENTS, CAN_VIEW_REPORTS, ROLE_LABELS } from '../../constants/roles'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard, roles: null },
  { to: '/leads',     label: 'Leads',      icon: Users,           roles: null },
  { to: '/agents',    label: 'Agents',     icon: UserCheck,       roles: CAN_VIEW_AGENTS },
  { to: '/reports',   label: 'Reports',    icon: BarChart2,       roles: CAN_VIEW_REPORTS },
]

export default function Sidebar({ onClose }) {
  const { profile, logout } = useAuthContext()
  const role = profile?.role

  const visibleItems = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.includes(role)
  )

  return (
    <aside className="flex flex-col h-full w-64 bg-brand-blue text-white">
      {/* Logo + close button (mobile) */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <div>
          <span className="text-lg font-bold tracking-wide">Ranav CRM</span>
          <p className="text-xs text-white/50 mt-0.5">Ranav Group</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/60 hover:text-white lg:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-white/10">
        {profile && (
          <div className="mb-3 px-2">
            <p className="text-sm font-semibold text-white truncate">{profile.full_name}</p>
            <p className="text-xs text-white/50 mt-0.5">{ROLE_LABELS[role] ?? role}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
