import { Menu } from 'lucide-react'
import { format } from 'date-fns'
import { useAuthContext } from '../../context/AuthContext'
import { ROLE_LABELS } from '../../constants/roles'

export default function TopBar({ title, onMenuClick }) {
  const { profile } = useAuthContext()

  const initials = profile?.full_name
    ?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'

  return (
    <header
      style={{
        height: 60,
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.6)',
        boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 12,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Gold accent line at top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #C9922A 0%, rgba(201,146,42,0.3) 60%, transparent 100%)', borderRadius: '0 0 2px 0' }} />

      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden cursor-pointer rounded-xl transition-colors"
        style={{ color: 'rgba(15,30,60,0.45)', padding: 6, marginLeft: -6, background: 'transparent', border: 'none' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(27,58,107,0.07)'; e.currentTarget.style.color = '#1B3A6B' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(15,30,60,0.45)' }}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Page title + date */}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#0F1E3C', letterSpacing: '-0.01em', lineHeight: 1 }}>
          {title}
        </p>
        <p className="hidden sm:block" style={{ fontSize: 10, fontWeight: 500, color: 'rgba(15,30,60,0.35)', marginTop: 3, letterSpacing: '0.04em' }}>
          {format(new Date(), 'EEEE, dd MMM yyyy')}
        </p>
      </div>

      {/* User section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="hidden sm:block" style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#0F1E3C', lineHeight: 1 }}>{profile?.full_name}</p>
          <p style={{ fontSize: 10, color: 'rgba(15,30,60,0.38)', marginTop: 3, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
            {ROLE_LABELS[profile?.role] ?? ''}
          </p>
        </div>

        {/* Avatar */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #1B3A6B 0%, #0F1E3C 100%)',
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            boxShadow: '0 2px 8px rgba(15,30,60,0.25)',
            border: '2px solid rgba(255,255,255,0.6)',
            letterSpacing: '0.05em',
          }}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}
