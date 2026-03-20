import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, isPast } from 'date-fns'
import { ArrowLeft, Phone, MessageCircle, Pencil, Trash2, AlertTriangle, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import LeadDetail from '../components/leads/LeadDetail'
import LeadForm from '../components/leads/LeadForm'
import { useAuthContext } from '../context/AuthContext'
import { useLeads } from '../hooks/useLeads'
import { insforge } from '../insforge'
import { PIPELINE_STAGES, STAGE_BY_ID } from '../constants/pipelineStages'
import { LEAD_SOURCES, TAG_STYLES, LOST_REASONS } from '../constants/leadSources'
import { FULL_ACCESS_ROLES } from '../constants/roles'

export default function LeadDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuthContext()
  const { updateLead, checkDuplicate } = useLeads(profile)

  const [lead,        setLead]        = useState(null)
  const [entries,     setEntries]     = useState([])
  const [isLoading,   setIsLoading]   = useState(true)
  const [savingNote,  setSavingNote]  = useState(false)
  const [formOpen,    setFormOpen]    = useState(false)
  const [archiving,   setArchiving]   = useState(false)

  // Stage change state
  const [stageOpen,       setStageOpen]       = useState(false)
  const [pendingStage,    setPendingStage]     = useState(null)
  const [lostReason,      setLostReason]      = useState('')
  const [savingStage,     setSavingStage]     = useState(false)

  const canSeeAll = profile && FULL_ACCESS_ROLES.includes(profile.role)

  // ── Fetch lead ───────────────────────────────────────────────────────────
  const fetchLead = useCallback(async () => {
    const { data, error } = await insforge.database
      .from('leads')
      .select('*, assigned_agent:user_profiles!leads_assigned_to_fkey(id, full_name), project:projects!leads_project_id_fkey(id, name)')
      .eq('id', id)
      .single()
    if (error || !data) { navigate('/leads'); return }
    setLead(data)
  }, [id, navigate])

  // ── Fetch timeline (notes + activity log) ────────────────────────────────
  const fetchTimeline = useCallback(async () => {
    const [notesRes, activityRes] = await Promise.all([
      insforge.database
        .from('lead_notes')
        .select('*, agent:user_profiles!lead_notes_agent_id_fkey(full_name)')
        .eq('lead_id', id)
        .order('created_at', { ascending: false }),
      insforge.database
        .from('activity_log')
        .select('*, actor:user_profiles!activity_log_performed_by_fkey(full_name)')
        .eq('entity_type', 'lead')
        .eq('entity_id', id)
        .order('created_at', { ascending: false }),
    ])

    const notes = (notesRes.data || []).map(n => ({
      type:       'note',
      note:       n.note,
      agent_name: n.agent?.full_name,
      created_at: n.created_at,
    }))

    const activities = (activityRes.data || []).map(a => ({
      type:        'activity',
      action_type: a.action_type,
      new_value:   a.new_value,
      agent_name:  a.actor?.full_name,
      created_at:  a.created_at,
    }))

    const combined = [...notes, ...activities].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )
    setEntries(combined)
  }, [id])

  useEffect(() => {
    setIsLoading(true)
    Promise.all([fetchLead(), fetchTimeline()]).finally(() => setIsLoading(false))
  }, [fetchLead, fetchTimeline])

  // ── Add note ─────────────────────────────────────────────────────────────
  const handleAddNote = async (text) => {
    setSavingNote(true)
    try {
      const { error } = await insforge.database.from('lead_notes').insert([{
        lead_id:  id,
        agent_id: profile.id,
        note:     text,
      }])
      if (error) throw error
      toast.success('Note saved')
      await fetchTimeline()
    } catch (err) {
      toast.error('Failed to save note')
    } finally {
      setSavingNote(false)
    }
  }

  // ── Stage change ─────────────────────────────────────────────────────────
  const requestStageChange = (stageId) => {
    setStageOpen(false)
    if (stageId === lead.pipeline_stage) return
    if (stageId === 'lost') {
      setPendingStage(stageId)
      setLostReason('')
    } else {
      confirmStageChange(stageId)
    }
  }

  const confirmStageChange = async (stageId, reason) => {
    setSavingStage(true)
    try {
      const updates = { pipeline_stage: stageId }
      if (reason) updates.lost_reason = reason
      await updateLead(id, updates, lead)
      toast.success('Stage updated')
      setPendingStage(null)
      setLostReason('')
      await Promise.all([fetchLead(), fetchTimeline()])
    } catch {
      toast.error('Failed to update stage')
    } finally {
      setSavingStage(false)
    }
  }

  // ── Archive ───────────────────────────────────────────────────────────────
  const handleArchive = async () => {
    if (!window.confirm(`Archive "${lead.full_name}"? This lead will be hidden.`)) return
    setArchiving(true)
    try {
      await updateLead(id, { is_deleted: true }, lead)
      toast.success('Lead archived')
      navigate('/leads')
    } catch {
      toast.error('Failed to archive lead')
      setArchiving(false)
    }
  }

  // ── Follow-up update ──────────────────────────────────────────────────────
  const handleFollowUpChange = async (e) => {
    const value = e.target.value
    try {
      await updateLead(id, { follow_up_at: value ? new Date(value).toISOString() : null }, lead)
      toast.success('Follow-up updated')
      await fetchLead()
    } catch {
      toast.error('Failed to update follow-up')
    }
  }

  const handleSaveForm = () => {
    setFormOpen(false)
    Promise.all([fetchLead(), fetchTimeline()])
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Layout title="Lead Detail">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-100 rounded-xl" />
          <div className="h-48 bg-gray-100 rounded-xl" />
        </div>
      </Layout>
    )
  }

  if (!lead) return null

  const stage       = STAGE_BY_ID[lead.pipeline_stage] || {}
  const source      = LEAD_SOURCES.find(s => s.id === lead.source)
  const isOverdue   = lead.follow_up_at && isPast(new Date(lead.follow_up_at))
  const waNumber    = lead.mobile.replace(/\D/g, '')
  const waMsg       = encodeURIComponent(`Hi ${lead.full_name}, this is from Ranav Group. `)

  // Format follow_up_at for datetime-local input
  const followUpLocal = lead.follow_up_at
    ? new Date(lead.follow_up_at).toISOString().slice(0, 16)
    : ''

  return (
    <Layout title="Lead Detail">
      {/* Back */}
      <button
        onClick={() => navigate('/leads')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-blue mb-4"
      >
        <ArrowLeft size={15} /> Back to Leads
      </button>

      {/* Overdue banner */}
      {isOverdue && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
          <AlertTriangle size={16} />
          Follow-up overdue — {format(new Date(lead.follow_up_at), 'dd MMM yyyy, h:mm a')}
          <button
            onClick={() => document.getElementById('followup-input').focus()}
            className="ml-auto underline text-xs"
          >
            Update
          </button>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-3 lg:gap-5">
        {/* ── Left: Info + Timeline ───────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Lead info card */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{lead.full_name}</h2>
                <p className="text-sm text-gray-500">{lead.mobile}</p>
                {lead.email && <p className="text-sm text-gray-400">{lead.email}</p>}
              </div>

              {/* Stage dropdown */}
              <div className="relative">
                <button
                  onClick={() => setStageOpen(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: stage.color }}
                >
                  {stage.label || lead.pipeline_stage}
                  <ChevronDown size={12} />
                </button>
                {stageOpen && (
                  <div className="absolute right-0 top-9 z-30 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1 overflow-hidden">
                    {PIPELINE_STAGES.map(s => (
                      <button
                        key={s.id}
                        onClick={() => requestStageChange(s.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${s.id === lead.pipeline_stage ? 'font-semibold' : ''}`}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Badges row */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {source && (
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{source.label}</span>
              )}
              {lead.assigned_agent?.full_name && (
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs">{lead.assigned_agent.full_name}</span>
              )}
              {lead.project?.name && (
                <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs">{lead.project.name}</span>
              )}
              {lead.budget_range && (
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{lead.budget_range}</span>
              )}
              {lead.property_interest && (
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs capitalize">{lead.property_interest}</span>
              )}
            </div>

            {/* Tags */}
            {lead.tags?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {lead.tags.map(tag => (
                  <span
                    key={tag}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${TAG_STYLES[tag] || 'bg-gray-100 text-gray-500'}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Lost reason */}
            {lead.lost_reason && (
              <p className="mt-2 text-xs text-gray-500">
                <span className="font-medium text-gray-700">Lost reason:</span> {lead.lost_reason}
              </p>
            )}

            {/* Referral */}
            {lead.referral_by && (
              <p className="mt-1 text-xs text-gray-500">
                <span className="font-medium text-gray-700">Referred by:</span> {lead.referral_by}
              </p>
            )}

            {/* Follow-up */}
            <div className="mt-3 flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600 shrink-0">Follow-up:</label>
              <input
                id="followup-input"
                type="datetime-local"
                defaultValue={followUpLocal}
                onBlur={handleFollowUpChange}
                className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
            </div>

            {/* Internal notes */}
            {lead.notes && (
              <div className="mt-3 bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Initial notes</p>
                <p className="text-sm text-gray-700">{lead.notes}</p>
              </div>
            )}

            {/* Created */}
            <p className="mt-3 text-xs text-gray-400">
              Added {format(new Date(lead.created_at), 'dd MMM yyyy, h:mm a')}
            </p>
          </div>

          {/* Timeline */}
          <LeadDetail entries={entries} onAddNote={handleAddNote} savingNote={savingNote} />
        </div>

        {/* ── Right: Quick Actions ──────────────────────────────── */}
        <div className="mt-4 lg:mt-0 space-y-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2.5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>

            <a
              href={`tel:${lead.mobile}`}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-medium"
            >
              <Phone size={15} /> Call {lead.full_name.split(' ')[0]}
            </a>

            <a
              href={`https://wa.me/${waNumber}?text=${waMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium"
            >
              <MessageCircle size={15} /> WhatsApp
            </a>

            <button
              onClick={() => setFormOpen(true)}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium"
            >
              <Pencil size={15} /> Edit Lead
            </button>

            {canSeeAll && (
              <button
                onClick={handleArchive}
                disabled={archiving}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-red-50 text-red-700 rounded-xl text-sm font-medium disabled:opacity-40"
              >
                <Trash2 size={15} /> {archiving ? 'Archiving…' : 'Archive Lead'}
              </button>
            )}
          </div>

          {/* Stage summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Pipeline Stages</h3>
            <div className="space-y-1.5">
              {PIPELINE_STAGES.map(s => (
                <div key={s.id} className={`flex items-center gap-2 py-1 px-2 rounded-lg ${s.id === lead.pipeline_stage ? 'bg-gray-50 ring-1 ring-gray-200' : ''}`}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className={`text-xs ${s.id === lead.pipeline_stage ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                    {s.label}
                  </span>
                  {s.id === lead.pipeline_stage && (
                    <span className="ml-auto text-xs text-brand-blue font-medium">Current</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lost reason modal */}
      {pendingStage === 'lost' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-1">Mark as Lost</h3>
            <p className="text-sm text-gray-500 mb-4">
              Why is <span className="font-medium text-gray-800">{lead.full_name}</span> being marked as lost?
            </p>
            <div className="space-y-2 mb-5 max-h-56 overflow-y-auto">
              {LOST_REASONS.map(reason => (
                <label key={reason} className="flex items-center gap-3 cursor-pointer group py-0.5">
                  <input
                    type="radio"
                    name="lost_reason"
                    value={reason}
                    checked={lostReason === reason}
                    onChange={() => setLostReason(reason)}
                    className="accent-brand-blue"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{reason}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setPendingStage(null); setLostReason('') }}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmStageChange('lost', lostReason)}
                disabled={!lostReason || savingStage}
                className="flex-1 py-2.5 bg-brand-red text-white rounded-xl text-sm font-medium disabled:opacity-40"
              >
                {savingStage ? 'Saving…' : 'Mark Lost'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click-away to close stage dropdown */}
      {stageOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setStageOpen(false)} />
      )}

      {/* Edit form */}
      {formOpen && (
        <LeadForm
          lead={lead}
          onClose={() => setFormOpen(false)}
          onSave={handleSaveForm}
          addLead={() => {}}
          updateLead={updateLead}
          checkDuplicate={checkDuplicate}
        />
      )}
    </Layout>
  )
}
