import { NavLink, useLocation } from 'react-router-dom'
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

function Avatar({ name }) {
  const initials = name
    ?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'
  return (
    <div className="w-9 h-9 rounded-xl bg-brand-gold flex items-center justify-center font-bold text-white text-sm shrink-0">
      {initials}
    </div>
  )
}

export default function Sidebar({ onClose }) {
  const { profile, logout } = useAuthContext()
  const location = useLocation()
  const role = profile?.role

  const visibleItems = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.includes(role)
  )

  return (
    <aside className="flex flex-col h-full w-60 select-none" style={{ backgroundColor: '#0F1E3C' }}>

      {/* ── Logo ──────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <div className="flex flex-col gap-0.5">
          <img
            src="/ranav-logo.png"
            alt="Ranav Group"
            width={120} height={40}
            className="h-10 w-auto object-contain"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
          />
          <p className="text-[10px] pl-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>CRM Portal</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="cursor-pointer lg:hidden transition-opacity hover:opacity-100"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── Divider ──────────────────────────────── */}
      <div className="mx-5 mb-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />

      {/* ── Navigation ───────────────────────────── */}
      <nav className="flex-1 px-3 space-y-0.5">
        {visibleItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to ||
            (to !== '/dashboard' && location.pathname.startsWith(to))
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer"
              style={{
                backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: isActive ? '#ffffff' : 'rgba(255,255,255,0.7)',
              }}
            >
              {/* Gold left bar for active */}
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                  style={{ backgroundColor: '#C9922A' }}
                />
              )}
              <Icon
                size={17}
                className="shrink-0"
                style={{ color: isActive ? '#C9922A' : 'rgba(255,255,255,0.6)' }}
              />
              <span>{label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* ── User section ─────────────────────────── */}
      <div className="mx-5 mt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
      <div className="px-4 py-4 space-y-3">
        {profile && (
          <div className="flex items-center gap-2.5 px-1">
            <Avatar name={profile.full_name} />
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate leading-none" style={{ color: '#ffffff' }}>
                {profile.full_name}
              </p>
              <p className="text-[10px] mt-1 leading-none" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {ROLE_LABELS[role] ?? role}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
