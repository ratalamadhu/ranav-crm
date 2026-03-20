import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, TrendingUp, Users, BarChart3, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthContext } from '../context/AuthContext'

const STATS = [
  { icon: TrendingUp, value: '3x',   label: 'Faster follow-ups' },
  { icon: Users,      value: '100%', label: 'Team visibility'   },
  { icon: BarChart3,  value: 'Live', label: 'Pipeline tracking' },
]

export default function Login() {
  const { login }  = useAuthContext()
  const navigate   = useNavigate()
  const location   = useLocation()
  const from       = location.state?.from?.pathname ?? '/dashboard'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

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

  return (
    <div className="min-h-screen flex">

      {/* ── Left brand panel (desktop only) ───────────── */}
      <div className="hidden lg:flex lg:w-[45%] bg-sidebar flex-col justify-between p-12 relative overflow-hidden">
        {/* Background geometric pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, #C9922A 1px, transparent 1px),
                              radial-gradient(circle at 80% 80%, #1B3A6B 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
        {/* Gradient orbs */}
        <div className="absolute top-[-80px] right-[-80px] w-72 h-72 bg-brand-blue/30 rounded-full blur-3xl" />
        <div className="absolute bottom-[-80px] left-[-40px] w-64 h-64 bg-brand-gold/20 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-gold/20 border border-brand-gold/30 flex items-center justify-center">
              <span className="text-brand-gold font-bold text-base">R</span>
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none">Ranav CRM</p>
              <p className="text-white/40 text-xs mt-0.5">Ranav Group</p>
            </div>
          </div>
        </div>

        {/* Main headline */}
        <div className="relative space-y-6">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Close more deals.<br />
              <span className="text-brand-gold">Faster.</span>
            </h2>
            <p className="text-white/50 mt-4 text-base leading-relaxed">
              Your entire real estate pipeline — leads, follow-ups, and team — in one place.
            </p>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-brand-gold" />
                </div>
                <span className="text-white/80 text-sm">
                  <span className="font-semibold text-white">{value}</span> {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-white/25 text-xs">
          © {new Date().getFullYear()} Ranav Group. All rights reserved.
        </p>
      </div>

      {/* ── Right form panel ──────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-sidebar flex items-center justify-center">
            <span className="text-brand-gold font-bold">R</span>
          </div>
          <span className="text-xl font-bold text-sidebar">Ranav CRM</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@ranavgroup.com"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm
                           focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue
                           placeholder:text-gray-300 transition-all duration-200 shadow-sm"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 bg-white border border-gray-200 rounded-xl text-sm
                             focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue
                             placeholder:text-gray-300 transition-all duration-200 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors cursor-pointer"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 bg-red-50 border border-red-100 rounded-xl">
                <div className="w-4 h-4 rounded-full bg-brand-red/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-brand-red text-xs font-bold">!</span>
                </div>
                <p className="text-sm text-brand-red">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sidebar hover:bg-[#162840] text-white font-semibold py-3 rounded-xl
                         text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 shadow-md shadow-sidebar/20 mt-2 cursor-pointer"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Trust indicators */}
          <div className="mt-8 flex items-center justify-center gap-4">
            {['Secure login', 'Role-based access', 'Private data'].map(item => (
              <div key={item} className="flex items-center gap-1 text-xs text-gray-400">
                <CheckCircle2 size={11} className="text-green-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
