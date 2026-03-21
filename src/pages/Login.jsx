import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, TrendingUp, Users, BarChart3, ShieldCheck, Lock, Fingerprint } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthContext } from '../context/AuthContext'

const STATS = [
  { icon: TrendingUp, value: '3x',   label: 'Faster follow-ups' },
  { icon: Users,      value: '100%', label: 'Team visibility'   },
  { icon: BarChart3,  value: 'Live', label: 'Pipeline tracking' },
]

const TRUST = [
  { icon: ShieldCheck, label: 'Secure login'      },
  { icon: Lock,        label: 'Role-based access' },
  { icon: Fingerprint, label: 'Private data'      },
]

export default function Login() {
  const { login }  = useAuthContext()
  const navigate   = useNavigate()
  const location   = useLocation()
  const from       = location.state?.from?.pathname ?? '/dashboard'

  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [focused,     setFocused]     = useState('')   // 'email' | 'password'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message ?? 'Invalid email or password.')
      toast.error('Login failed')
    } finally {
      setLoading(false)
    }
  }

  // Shared input style
  const inputStyle = (name) => ({
    width: '100%',
    padding: '12px 16px',
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 500,
    background: 'rgba(255,255,255,0.07)',
    border: `1.5px solid ${focused === name ? 'rgba(201,146,42,0.7)' : 'rgba(255,255,255,0.12)'}`,
    color: '#ffffff',
    outline: 'none',
    transition: 'border-color 0.2s ease, background 0.2s ease',
    boxShadow: focused === name ? '0 0 0 3px rgba(201,146,42,0.12)' : 'none',
  })

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#080F1F',
        backgroundImage: `
          radial-gradient(ellipse 80% 60% at 20% -10%, rgba(27,58,107,0.55) 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 85% 100%, rgba(201,146,42,0.18) 0%, transparent 55%),
          radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)
        `,
        backgroundSize: 'auto, auto, 28px 28px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >

      {/* ── Left brand panel (desktop only) ─────────────────── */}
      <div
        className="hidden lg:flex lg:w-[46%] flex-col justify-between p-14 relative overflow-hidden"
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Gradient orbs */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,58,107,0.5) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,146,42,0.22) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <img
            src="/ranav-logo.png"
            alt="Ranav Group"
            width={200} height={96}
            style={{ height: 96, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.6)) brightness(1.05)' }}
          />
          <p style={{ fontSize: 10, marginTop: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', fontWeight: 600 }}>
            CRM Portal
          </p>
        </div>

        {/* Headline */}
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <h2 style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.15, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
            Close more deals.<br />
            <span style={{ color: '#C9922A' }}>Faster.</span>
          </h2>
          <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.48)', maxWidth: 340, margin: '16px auto 0' }}>
            Your entire real estate pipeline — leads, follow-ups, and team — in one place.
          </p>

          {/* Stats row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 36, flexWrap: 'wrap' }}>
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(201,146,42,0.14)', border: '1px solid rgba(201,146,42,0.28)' }}>
                  <Icon size={16} color="#C9922A" />
                </div>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>{value}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{ position: 'relative', fontSize: 11, textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
          © {new Date().getFullYear()} Ranav Group. All rights reserved.
        </p>
      </div>

      {/* ── Right glass form panel ───────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>

        {/* Mobile logo */}
        <div className="lg:hidden" style={{ marginBottom: 36, textAlign: 'center' }}>
          <img src="/ranav-logo.png" alt="Ranav Group" width={133} height={64} style={{ height: 64, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.5)) brightness(1.05)' }} />
          <p style={{ fontSize: 10, marginTop: 8, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', fontWeight: 600 }}>CRM Portal</p>
        </div>

        {/* Glass card */}
        <div
          style={{
            width: '100%',
            maxWidth: 400,
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.11)',
            borderRadius: 24,
            padding: '40px 36px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
          }}
        >
          {/* Card heading */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(201,146,42,0.9)', marginBottom: 8 }}>
              Ranav Group
            </p>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
              Welcome back
            </h1>
            <p style={{ fontSize: 14, marginTop: 6, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
              Sign in to your workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused('')}
                placeholder="you@ranavgroup.com"
                style={inputStyle('email')}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                  placeholder="••••••••"
                  style={{ ...inputStyle('password'), paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', background: 'none', border: 'none', padding: 0, display: 'flex' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: 'rgba(170,34,34,0.15)', border: '1px solid rgba(170,34,34,0.3)', borderRadius: 12 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(170,34,34,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <span style={{ color: '#f87171', fontSize: 11, fontWeight: 900 }}>!</span>
                </div>
                <p style={{ fontSize: 13, color: '#fca5a5', margin: 0 }}>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px 0',
                borderRadius: 14,
                border: 'none',
                background: loading ? 'rgba(201,146,42,0.5)' : 'linear-gradient(135deg, #C9922A 0%, #E6A830 100%)',
                color: '#0F1E3C',
                fontSize: 14,
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 4,
                transition: 'opacity 0.15s, transform 0.15s',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(201,146,42,0.35)',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {loading && <span style={{ width: 16, height: 16, border: '2px solid rgba(15,30,60,0.4)', borderTopColor: '#0F1E3C', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Trust indicators */}
          <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
            {TRUST.map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.28)', fontWeight: 500 }}>
                <Icon size={11} color="rgba(255,255,255,0.35)" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
