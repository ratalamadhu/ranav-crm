import { Menu } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { ROLE_LABELS } from '../../constants/roles'

export default function TopBar({ title, onMenuClick }) {
  const { profile } = useAuthContext()

  const initials = profile?.full_name
    ?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'

  return (
    <header className="h-14 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center px-5 gap-4 sticky top-0 z-10">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1 -ml-1 rounded-lg hover:bg-gray-100"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <h1 className="flex-1 text-sm font-semibold text-gray-500">{title}</h1>

      {/* User avatar */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:block text-right">
          <p className="text-xs font-semibold text-gray-800 leading-none">{profile?.full_name}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{ROLE_LABELS[profile?.role] ?? ''}</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-blue to-[#163060] text-white text-xs font-bold flex items-center justify-center select-none shadow-sm">
          {initials}
        </div>
      </div>
    </header>
  )
}
