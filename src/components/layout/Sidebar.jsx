import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, UserCheck, BarChart2, LogOut, X,
} from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { CAN_VIEW_AGENTS, CAN_VIEW_REPORTS, ROLE_LABELS } from '../../constants/roles'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: null },
  { to: '/leads',     label: 'Leads',     icon: Users,           roles: null },
  { to: '/agents',    label: 'Team',      icon: UserCheck,       roles: CAN_VIEW_AGENTS },
  { to: '/reports',   label: 'Reports',   icon: BarChart2,       roles: CAN_VIEW_REPORTS },
]

function Avatar({ name, size = 'md' }) {
  const initials = name
    ?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'
  const cls = size === 'sm'
    ? 'w-7 h-7 text-xs'
    : 'w-9 h-9 text-sm'
  return (
    <div className={`${cls} rounded-xl bg-gradient-to-br from-brand-gold/80 to-brand-gold flex items-center justify-center font-bold text-white shrink-0`}>
      {initials}
    </div>
  )
}

export default function Sidebar({ onClose }) {
  const { profile, logout } = useAuthContext()
  const role = profile?.role

  const visibleItems = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.includes(role)
  )

  return (
    <aside className="flex flex-col h-full w-60 bg-sidebar select-none">

      {/* ── Logo ──────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-gold/20 border border-brand-gold/30 flex items-center justify-center shrink-0">
            <span className="text-brand-gold font-bold text-sm">R</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">Ranav CRM</p>
            <p className="text-white/35 text-[10px] mt-0.5 leading-none">Ranav Group</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors cursor-pointer lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── Divider ──────────────────────────────── */}
      <div className="mx-5 border-t border-white/[0.06] mb-3" />

      {/* ── Navigation ───────────────────────────── */}
      <nav className="flex-1 px-3 space-y-0.5">
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:bg-white/5 hover:text-white/80'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active left indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-gold rounded-r-full" />
                )}
                <Icon
                  size={17}
                  className={`shrink-0 transition-colors ${isActive ? 'text-brand-gold' : 'text-white/40 group-hover:text-white/60'}`}
                />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User section ─────────────────────────── */}
      <div className="mx-5 border-t border-white/[0.06] mt-3" />
      <div className="px-4 py-4 space-y-3">
        {profile && (
          <div className="flex items-center gap-2.5 px-1">
            <Avatar name={profile.full_name} />
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate leading-none">{profile.full_name}</p>
              <p className="text-white/35 text-[10px] mt-1 leading-none">{ROLE_LABELS[role] ?? role}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs text-white/40
                     hover:bg-white/5 hover:text-white/70 transition-all duration-150 cursor-pointer"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
