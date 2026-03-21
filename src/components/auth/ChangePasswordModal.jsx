import { useState } from 'react'
import { KeyRound, Eye, EyeOff, X, ShieldCheck } from 'lucide-react'
import { insforge } from '../../insforge'
import toast from 'react-hot-toast'

export default function ChangePasswordModal({ onClose, forced = false }) {
  const [current,  setCurrent]  = useState('')
  const [next,     setNext]     = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showCur,  setShowCur]  = useState(false)
  const [showNew,  setShowNew]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  const validate = () => {
    if (!current)              return 'Enter your current password.'
    if (next.length < 8)       return 'New password must be at least 8 characters.'
    if (next !== confirm)      return 'Passwords do not match.'
    if (next === current)      return 'New password must be different from current.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    setSaving(true)
    setError('')
    try {
      // Verify current password by re-authenticating
      const user = await insforge.auth.getCurrentUser()
      const email = user?.data?.user?.email
      if (!email) throw new Error('Session expired. Please log in again.')

      const { data: authData, error: authErr } = await insforge.auth.signInWithPassword({ email, password: current })
      if (authErr) { setError('Current password is incorrect.'); setSaving(false); return }

      // Update to new password via PostgREST RPC (InsForge has no direct password-change API)
      // change_own_password() is a SECURITY DEFINER function that updates auth.users for auth.uid()
      const accessToken = authData?.accessToken
      if (!accessToken) throw new Error('Could not get session token. Please log in again.')

      const baseUrl = import.meta.env.VITE_INSFORGE_URL
      const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY
      const res = await fetch(`${baseUrl}/api/database/rpc/change_own_password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({ new_password: next }),
      })
      if (!res.ok) {
        const text = await res.text()
        const json = (() => { try { return JSON.parse(text) } catch { return {} } })()
        throw new Error(json?.message || json?.msg || `Password update failed (${res.status})`)
      }

      toast.success('Password updated successfully!')
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.8)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{
            background: 'linear-gradient(135deg, rgba(27,58,107,0.08) 0%, transparent 100%)',
            borderBottom: '1px solid rgba(27,58,107,0.08)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #243e6e 100%)', boxShadow: '0 4px 12px rgba(27,58,107,0.3)' }}
            >
              <KeyRound size={15} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#0F1E3C' }}>
                {forced ? 'Set Your Password' : 'Change Password'}
              </h3>
              {forced && (
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(15,30,60,0.5)' }}>
                  Please set a personal password to continue.
                </p>
              )}
            </div>
          </div>
          {!forced && (
            <button onClick={onClose} className="cursor-pointer transition-opacity hover:opacity-60" style={{ color: 'rgba(15,30,60,0.4)' }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {/* Current password */}
          <div>
            <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'rgba(15,30,60,0.55)' }}>
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCur ? 'text' : 'password'}
                value={current}
                onChange={e => setCurrent(e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
                className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'rgba(27,58,107,0.04)',
                  border: '1px solid rgba(27,58,107,0.14)',
                  color: '#0F1E3C',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(27,58,107,0.4)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(27,58,107,0.14)'}
              />
              <button type="button" onClick={() => setShowCur(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: 'rgba(15,30,60,0.35)' }}>
                {showCur ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'rgba(15,30,60,0.55)' }}>
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={next}
                onChange={e => setNext(e.target.value)}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'rgba(27,58,107,0.04)',
                  border: '1px solid rgba(27,58,107,0.14)',
                  color: '#0F1E3C',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(27,58,107,0.4)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(27,58,107,0.14)'}
              />
              <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: 'rgba(15,30,60,0.35)' }}>
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {/* Strength bar */}
            {next.length > 0 && (
              <div className="mt-1.5 flex gap-1">
                {[1,2,3,4].map(i => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-colors duration-300"
                    style={{
                      backgroundColor:
                        next.length < 6  ? (i <= 1 ? '#AA2222' : 'rgba(0,0,0,0.08)') :
                        next.length < 8  ? (i <= 2 ? '#C9922A' : 'rgba(0,0,0,0.08)') :
                        next.length < 12 ? (i <= 3 ? '#1A7A3A' : 'rgba(0,0,0,0.08)') :
                                           '#1A7A3A',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'rgba(15,30,60,0.55)' }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: confirm && confirm === next ? 'rgba(26,122,58,0.05)' : 'rgba(27,58,107,0.04)',
                border: `1px solid ${confirm && confirm === next ? 'rgba(26,122,58,0.3)' : 'rgba(27,58,107,0.14)'}`,
                color: '#0F1E3C',
              }}
              onFocus={e => { if (!(confirm && confirm === next)) e.currentTarget.style.borderColor = 'rgba(27,58,107,0.4)' }}
              onBlur={e => { if (!(confirm && confirm === next)) e.currentTarget.style.borderColor = 'rgba(27,58,107,0.14)' }}
            />
            {confirm && confirm === next && (
              <p className="flex items-center gap-1 mt-1 text-[11px] font-medium" style={{ color: '#1A7A3A' }}>
                <ShieldCheck size={11} /> Passwords match
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs font-medium px-3 py-2 rounded-xl" style={{ backgroundColor: 'rgba(170,34,34,0.07)', color: '#AA2222', border: '1px solid rgba(170,34,34,0.15)' }}>
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {!forced && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                style={{ border: '1px solid rgba(27,58,107,0.15)', color: 'rgba(15,30,60,0.55)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(27,58,107,0.04)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #1B3A6B 0%, #243e6e 100%)',
                boxShadow: '0 4px 14px rgba(27,58,107,0.35)',
              }}
            >
              {saving ? 'Updating…' : forced ? 'Set Password' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
