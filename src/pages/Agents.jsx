import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, UserX, UserCheck, Users, KeyRound, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import { useAuthContext } from '../context/AuthContext'
import { insforge } from '../insforge'
import { ROLES, ROLE_LABELS, CAN_VIEW_AGENTS } from '../constants/roles'

const BASE_URL  = import.meta.env.VITE_INSFORGE_URL
const ANON_KEY  = import.meta.env.VITE_INSFORGE_ANON_KEY

const ASSIGNABLE_ROLES = [
  { id: ROLES.ADMIN,       label: ROLE_LABELS.admin },
  { id: ROLES.MD,          label: ROLE_LABELS.md },
  { id: ROLES.DIRECTOR,    label: ROLE_LABELS.director },
  { id: ROLES.AGENT,       label: ROLE_LABELS.agent },
  { id: ROLES.COORDINATOR, label: ROLE_LABELS.coordinator },
]

// ── Reset Password modal (admin only) ────────────────────────────────────
function ResetPasswordModal({ agent, onClose, onDone }) {
  const [password,     setPassword]     = useState('')
  const [show,         setShow]         = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')
  const [dashboardUrl, setDashboardUrl] = useState('')

  const handleReset = async () => {
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setSaving(true)
    setError('')
    try {
      // Try SDK admin method first (Supabase-compatible)
      if (typeof insforge.auth.admin?.updateUserById === 'function') {
        const { error: sdkErr } = await insforge.auth.admin.updateUserById(agent.id, { password })
        if (sdkErr) throw sdkErr
      } else {
        // InsForge does not expose an admin password-update REST endpoint.
        // Try the admin users path in case it's undocumented.
        const res = await fetch(`${BASE_URL}/api/admin/users/${agent.id}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-api-key': ANON_KEY },
          body:    JSON.stringify({ password }),
        })
        const ct = res.headers.get('content-type') || ''
        if (!res.ok || !ct.includes('application/json')) {
          // No API path works — tell admin to use the InsForge dashboard
          throw Object.assign(
            new Error('InsForge does not support admin password reset via API.'),
            { dashboardUrl: true }
          )
        }
        const result = await res.json()
        if (!res.ok) throw new Error(result.message || result.error || 'Failed to reset password')
      }

      // Mark force_password_reset so agent must change on next login
      const { error: dbErr } = await insforge.database
        .from('user_profiles')
        .update({ force_password_reset: true })
        .eq('id', agent.id)
      if (dbErr) throw dbErr

      toast.success(`Password reset for ${agent.full_name.split(' ')[0]}. Share the new password with them.`)
      onDone()
    } catch (err) {
      setError(err.message || 'Something went wrong')
      if (err.dashboardUrl) setDashboardUrl(err.dashboardUrl)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" style={{ backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.8)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(27,58,107,0.08)' }}>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #1B3A6B, #243e6e)', boxShadow: '0 4px 12px rgba(27,58,107,0.3)' }}
          >
            <KeyRound size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: '#0F1E3C' }}>Reset Password</p>
            <p className="text-[11px]" style={{ color: 'rgba(15,30,60,0.45)' }}>{agent.full_name}</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs" style={{ color: 'rgba(15,30,60,0.55)' }}>
            Set a new temporary password. The agent will be required to change it on their next login.
          </p>

          <div>
            <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'rgba(15,30,60,0.55)' }}>
              New Temporary Password
            </label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                autoFocus
                className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'rgba(27,58,107,0.04)',
                  border: '1px solid rgba(27,58,107,0.14)',
                  color: '#0F1E3C',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(27,58,107,0.4)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(27,58,107,0.14)'}
                onKeyDown={e => e.key === 'Enter' && handleReset()}
              />
              <button
                type="button"
                onClick={() => setShow(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                style={{ color: 'rgba(15,30,60,0.35)' }}
              >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-xs rounded-xl overflow-hidden" style={{ border: '1px solid rgba(170,34,34,0.2)' }}>
              <div className="px-3 py-2.5" style={{ background: 'rgba(170,34,34,0.07)', color: '#AA2222' }}>
                InsForge has no API or UI for admin password reset.
              </div>
              {dashboardUrl && (
                <div className="px-3 py-3 space-y-2" style={{ background: 'rgba(27,58,107,0.04)', borderTop: '1px solid rgba(27,58,107,0.1)' }}>
                  <p className="font-semibold" style={{ color: '#0F1E3C' }}>Run this via InsForge MCP:</p>
                  <code
                    className="block text-[10px] leading-relaxed p-2 rounded-lg select-all"
                    style={{ background: '#0F1E3C', color: '#67E8F9', fontFamily: 'monospace' }}
                  >
                    {`UPDATE auth.users\nSET encrypted_password = crypt('${password || 'NEW_PASSWORD'}', gen_salt('bf'))\nWHERE id = '${agent.id}';`}
                  </code>
                  <p className="text-[10px]" style={{ color: 'rgba(15,30,60,0.45)' }}>
                    Open Claude Code in ranav-crm folder → use InsForge MCP <code style={{ background: 'rgba(27,58,107,0.08)', padding: '1px 4px', borderRadius: 4 }}>run-raw-sql</code> tool with the query above.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              style={{ border: '1px solid rgba(27,58,107,0.15)', color: 'rgba(15,30,60,0.55)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(27,58,107,0.04)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Cancel
            </button>
            <button
              onClick={handleReset}
              disabled={saving || password.length < 8}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #1B3A6B, #243e6e)', boxShadow: '0 4px 14px rgba(27,58,107,0.35)' }}
            >
              {saving ? 'Resetting…' : 'Reset Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Agent form modal ─────────────────────────────────────────────────────
function AgentForm({ agent, onClose, onSaved }) {
  const isEdit = !!agent
  const [form,   setForm]   = useState({
    full_name: agent?.full_name || '',
    email:     agent?.email     || '',
    mobile:    agent?.mobile    || '',
    role:      agent?.role      || ROLES.AGENT,
    password:  '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async () => {
    if (!form.full_name.trim()) return setError('Full name is required.')
    if (!isEdit && !form.email.trim()) return setError('Email is required.')
    if (!isEdit && form.password.length < 8) return setError('Password must be at least 8 characters.')
    setError('')
    setSaving(true)

    try {
      if (isEdit) {
        // Edit: only update user_profiles
        const { error: upErr } = await insforge.database
          .from('user_profiles')
          .update({ full_name: form.full_name.trim(), mobile: form.mobile.trim(), role: form.role })
          .eq('id', agent.id)
        if (upErr) throw upErr
        toast.success('Agent updated')
      } else {
        // Create auth user via InsForge admin API
        const res = await fetch(`${BASE_URL}/api/auth/users`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': ANON_KEY },
          body:    JSON.stringify({ email: form.email.trim(), password: form.password }),
        })
        const result = await res.json()
        if (!res.ok) throw new Error(result.message || result.error || 'Failed to create auth user')
        const userId = result.user?.id || result.id
        if (!userId) throw new Error('No user ID returned from auth API')

        // Create user_profiles row
        const { error: profileErr } = await insforge.database
          .from('user_profiles')
          .insert([{
            id:        userId,
            full_name: form.full_name.trim(),
            mobile:    form.mobile.trim(),
            role:      form.role,
            is_active: true,
          }])
        if (profileErr) throw profileErr
        toast.success(`Agent ${form.full_name.split(' ')[0]} added`)
      }
      onSaved()
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-base font-bold text-gray-900 mb-5">
          {isEdit ? 'Edit Agent' : 'Add New Agent'}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
            <input
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              placeholder="e.g. Ravi Kumar"
            />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                placeholder="agent@ranavgroup.com"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mobile</label>
            <input
              type="tel"
              value={form.mobile}
              onChange={e => set('mobile', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Role *</label>
            <select
              value={form.role}
              onChange={e => set('role', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
            >
              {ASSIGNABLE_ROLES.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>

          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Temporary Password *</label>
              <input
                type="password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                placeholder="Min 8 characters"
              />
              <p className="text-xs text-gray-400 mt-1">Share this with the agent so they can log in.</p>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 bg-brand-blue text-white rounded-xl text-sm font-medium disabled:opacity-40"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Agent'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Agents page ─────────────────────────────────────────────────────
export default function Agents() {
  const { profile } = useAuthContext()

  const [agents,    setAgents]    = useState([])
  const [leadCounts, setLeadCounts] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [formOpen,    setFormOpen]    = useState(false)
  const [editing,     setEditing]     = useState(null)
  const [togglingId,  setTogglingId]  = useState(null)
  const [resetAgent,  setResetAgent]  = useState(null)   // agent being password-reset

  const canManage = profile?.role === ROLES.ADMIN
  const canView   = profile && CAN_VIEW_AGENTS.includes(profile.role)

  const fetchAgents = useCallback(async () => {
    setIsLoading(true)
    const [agentsRes, leadsRes] = await Promise.all([
      insforge.database
        .from('user_profiles')
        .select('*')
        .order('full_name'),
      insforge.database
        .from('leads')
        .select('id, assigned_to')
        .eq('is_deleted', false),
    ])

    setAgents(agentsRes.data || [])

    const counts = {}
    ;(leadsRes.data || []).forEach(l => {
      if (l.assigned_to) counts[l.assigned_to] = (counts[l.assigned_to] || 0) + 1
    })
    setLeadCounts(counts)
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchAgents() }, [fetchAgents])

  const toggleActive = async (agent) => {
    setTogglingId(agent.id)
    try {
      const { error } = await insforge.database
        .from('user_profiles')
        .update({ is_active: !agent.is_active })
        .eq('id', agent.id)
      if (error) throw error
      toast.success(agent.is_active ? 'Agent deactivated' : 'Agent activated')
      await fetchAgents()
    } catch {
      toast.error('Failed to update status')
    } finally {
      setTogglingId(null)
    }
  }

  const openAdd  = () => { setEditing(null);  setFormOpen(true) }
  const openEdit = (a) => { setEditing(a);    setFormOpen(true) }

  if (!canView) {
    return (
      <Layout title="Agents">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">You don't have access to this page.</p>
        </div>
      </Layout>
    )
  }

  const active   = agents.filter(a => a.is_active)
  const inactive = agents.filter(a => !a.is_active)

  return (
    <Layout title="Agents">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-brand-blue">Team</h1>
          {!isLoading && (
            <p className="text-sm text-gray-500">{active.length} active · {inactive.length} inactive</p>
          )}
        </div>
        {canManage && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-brand-blue/90"
          >
            <Plus size={15} /> Add Agent
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center mb-4">
            <Users size={28} className="text-brand-blue" />
          </div>
          <h3 className="text-base font-semibold text-gray-800">No agents yet</h3>
          <p className="text-sm text-gray-400 mt-1 mb-4">Add your first team member to get started.</p>
          {canManage && (
            <button onClick={openAdd} className="px-4 py-2 bg-brand-blue text-white rounded-lg text-sm font-medium">
              Add First Agent
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Mobile</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Leads</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                  {canManage && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {agents.map(agent => (
                  <tr key={agent.id} className={`border-b border-gray-50 hover:bg-gray-50/60 ${!agent.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{agent.full_name}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{agent.mobile || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full text-xs font-medium">
                        {ROLE_LABELS[agent.role] || agent.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{leadCounts[agent.id] || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${agent.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {agent.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3 text-xs font-medium">
                          <button onClick={() => openEdit(agent)} className="text-blue-600 hover:text-blue-700">
                            Edit
                          </button>

                          <button
                            onClick={() => toggleActive(agent)}
                            disabled={togglingId === agent.id}
                            className={`${agent.is_active ? 'text-red-500 hover:text-red-600' : 'text-green-600 hover:text-green-700'} disabled:opacity-40`}
                          >
                            {togglingId === agent.id ? '…' : agent.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {agents.map(agent => (
              <div
                key={agent.id}
                className={`bg-white rounded-xl border border-gray-200 p-4 ${!agent.is_active ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{agent.full_name}</p>
                    <p className="text-xs text-gray-500">{agent.mobile || 'No mobile'}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${agent.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {agent.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full text-xs font-medium">
                    {ROLE_LABELS[agent.role] || agent.role}
                  </span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {leadCounts[agent.id] || 0} leads
                  </span>
                </div>

                {canManage && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => openEdit(agent)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      onClick={() => setResetAgent(agent)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium"
                      style={{ backgroundColor: 'rgba(201,146,42,0.10)', color: '#8A6010' }}
                    >
                      <KeyRound size={12} /> Reset Pwd
                    </button>
                    <button
                      onClick={() => toggleActive(agent)}
                      disabled={togglingId === agent.id}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium disabled:opacity-40 ${
                        agent.is_active
                          ? 'bg-red-50 text-red-600'
                          : 'bg-green-50 text-green-700'
                      }`}
                    >
                      {agent.is_active
                        ? <><UserX size={12} /> Deactivate</>
                        : <><UserCheck size={12} /> Activate</>
                      }
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {formOpen && (
        <AgentForm
          agent={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); fetchAgents() }}
        />
      )}

      {resetAgent && (
        <ResetPasswordModal
          agent={resetAgent}
          onClose={() => setResetAgent(null)}
          onDone={() => setResetAgent(null)}
        />
      )}
    </Layout>
  )
}
