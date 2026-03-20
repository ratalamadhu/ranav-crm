import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthContext } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuthContext()
  const navigate   = useNavigate()
  const location   = useLocation()
  const from       = location.state?.from?.pathname ?? '/dashboard'

  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message ?? 'Login failed. Please try again.')
      toast.error('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-blue px-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header band */}
          <div className="bg-brand-blue px-8 py-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 rounded-xl mb-4">
              <Building2 size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Ranav CRM</h1>
            <p className="text-white/60 text-sm mt-1">Ranav Group — Real Estate</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@ranavgroup.com"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent
                           placeholder:text-gray-400 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  className="w-full px-3.5 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent
                             placeholder:text-gray-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-sm text-brand-red bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-blue hover:bg-[#163060] text-white font-semibold py-2.5 rounded-lg
                         text-sm transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center
                         justify-center gap-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Ranav Group. All rights reserved.
        </p>
      </div>
    </div>
  )
}
