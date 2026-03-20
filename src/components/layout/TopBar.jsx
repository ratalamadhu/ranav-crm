import { Menu, Bell } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { ROLE_LABELS } from '../../constants/roles'

export default function TopBar({ title, onMenuClick }) {
  const { profile } = useAuthContext()

  const initials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?'

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 sticky top-0 z-10">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-500 hover:text-gray-700"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Page title */}
      <h1 className="flex-1 text-base font-semibold text-gray-800">{title}</h1>

      {/* Notification bell (inactive in Phase 1) */}
      <button className="text-gray-400 hover:text-gray-600" aria-label="Notifications">
        <Bell size={20} />
      </button>

      {/* User avatar */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-brand-blue text-white text-xs font-bold flex items-center justify-center select-none">
          {initials}
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-xs font-medium text-gray-800 leading-none">{profile?.full_name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{ROLE_LABELS[profile?.role] ?? ''}</p>
        </div>
      </div>
    </header>
  )
}
