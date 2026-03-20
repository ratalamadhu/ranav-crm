import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, UserX, UserCheck, Users } from 'lucide-react'
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
  const [formOpen,  setFormOpen]  = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [togglingId, setTogglingId] = useState(null)

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
    </Layout>
  )
}
