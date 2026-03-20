import { useState, useEffect, useCallback } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { insforge } from '../../insforge'
import { useAuthContext } from '../../context/AuthContext'
import { LEAD_SOURCES, LEAD_TAGS, BUDGET_RANGES } from '../../constants/leadSources'
import { PIPELINE_STAGES } from '../../constants/pipelineStages'
import { PROPERTY_INTERESTS } from '../../constants/projects'
import { FULL_ACCESS_ROLES } from '../../constants/roles'

const EMPTY_FORM = {
  full_name:         '',
  mobile:            '',
  email:             '',
  source:            '',
  property_interest: '',
  project_id:        '',
  budget_range:      '',
  tags:              [],
  assigned_to:       '',
  follow_up_at:      '',
  pipeline_stage:    'new_lead',
  notes:             '',
}

export default function LeadForm({ lead, onClose, onSave, checkDuplicate, addLead, updateLead }) {
  const { profile } = useAuthContext()
  const isEdit   = !!lead?.id
  const canAssign = FULL_ACCESS_ROLES.includes(profile?.role)

  const [form, setForm] = useState(() => {
    if (isEdit) {
      return {
        ...EMPTY_FORM,
        ...lead,
        follow_up_at: lead.follow_up_at
          ? new Date(lead.follow_up_at).toISOString().slice(0, 16)
          : '',
        tags:        lead.tags || [],
        assigned_to: lead.assigned_to || '',
        project_id:  lead.project_id  || '',
      }
    }
    return { ...EMPTY_FORM, assigned_to: canAssign ? '' : (profile?.id || '') }
  })

  const [projects,   setProjects]   = useState([])
  const [agents,     setAgents]     = useState([])
  const [duplicate,  setDuplicate]  = useState(null)
  const [errors,     setErrors]     = useState({})
  const [saving,     setSaving]     = useState(false)

  useEffect(() => {
    insforge
      .from('projects')
      .select('id, name')
      .eq('is_active', true)
      .then(({ data }) => setProjects(data || []))
  }, [])

  useEffect(() => {
    if (!canAssign) return
    insforge
      .from('user_profiles')
      .select('id, full_name, role')
      .eq('is_active', true)
      .then(({ data }) => setAgents(data || []))
  }, [canAssign])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  const handleMobileBlur = useCallback(async () => {
    if (isEdit) return
    const dup = await checkDuplicate(form.mobile)
    setDuplicate(dup)
  }, [form.mobile, checkDuplicate, isEdit])

  const toggleTag = (tag) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }))
  }

  const validate = () => {
    const errs = {}
    if (!form.full_name.trim()) errs.full_name = 'Name is required'
    if (!form.mobile.trim())    errs.mobile    = 'Mobile is required'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      const payload = {
        ...form,
        follow_up_at: form.follow_up_at ? new Date(form.follow_up_at).toISOString() : null,
        project_id:   form.project_id   || null,
        assigned_to:  form.assigned_to  || (canAssign ? null : profile.id),
        tags:         form.tags,
      }
      // Remove joined/computed fields that shouldn't be sent
      delete payload.assigned_agent
      delete payload.project

      let result
      if (isEdit) {
        result = await updateLead(lead.id, payload, lead)
        toast.success('Lead updated')
      } else {
        result = await addLead(payload)
        toast.success('Lead added')
      }
      onSave(result)
    } catch (err) {
      toast.error(err.message || 'Failed to save lead')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Form panel */}
      <form
        onSubmit={handleSubmit}
        className="relative w-full sm:max-w-xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-brand-blue">
            {isEdit ? 'Edit Lead' : 'Add New Lead'}
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable fields */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Duplicate warning */}
          {duplicate && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>
                <strong>Possible duplicate:</strong> "{duplicate.full_name}" already has this mobile number.
              </span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => handleChange('full_name', e.target.value)}
              placeholder="Enter full name"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40 ${
                errors.full_name ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>}
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={form.mobile}
              onChange={e => handleChange('mobile', e.target.value)}
              onBlur={handleMobileBlur}
              placeholder="+91 98765 43210"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40 ${
                errors.mobile ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.mobile && <p className="mt-1 text-xs text-red-500">{errors.mobile}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              placeholder="email@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
            />
          </div>

          {/* Source + Property Interest (2 col) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lead Source</label>
              <select
                value={form.source}
                onChange={e => handleChange('source', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              >
                <option value="">Select source</option>
                {LEAD_SOURCES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interest</label>
              <select
                value={form.property_interest}
                onChange={e => handleChange('property_interest', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              >
                <option value="">Select</option>
                {PROPERTY_INTERESTS.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Project + Budget (2 col) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <select
                value={form.project_id}
                onChange={e => handleChange('project_id', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              >
                <option value="">Select project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
              <select
                value={form.budget_range}
                onChange={e => handleChange('budget_range', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              >
                <option value="">Select range</option>
                {BUDGET_RANGES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {LEAD_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    form.tags.includes(tag)
                      ? 'bg-brand-blue text-white border-brand-blue'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-brand-blue'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Assign To (admin/md/director only) */}
          {canAssign && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
              <select
                value={form.assigned_to}
                onChange={e => handleChange('assigned_to', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              >
                <option value="">Unassigned</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.full_name} ({a.role})</option>
                ))}
              </select>
            </div>
          )}

          {/* Follow-up date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date & Time</label>
            <input
              type="datetime-local"
              value={form.follow_up_at}
              onChange={e => handleChange('follow_up_at', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
            />
          </div>

          {/* Pipeline Stage (edit mode only) */}
          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline Stage</label>
              <select
                value={form.pipeline_stage}
                onChange={e => handleChange('pipeline_stage', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              >
                {PIPELINE_STAGES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => handleChange('notes', e.target.value)}
              rows={3}
              placeholder="Any additional notes..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-brand-blue/90 disabled:opacity-60"
          >
            {saving ? 'Saving…' : isEdit ? 'Update Lead' : 'Add Lead'}
          </button>
        </div>
      </form>
    </div>
  )
}
