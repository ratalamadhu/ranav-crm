import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, SlidersHorizontal, LayoutGrid, List, X, Phone, MessageCircle, Pencil, CalendarClock } from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'
import Layout from '../components/layout/Layout'
import { useAuthContext } from '../context/AuthContext'
import { useLeads } from '../hooks/useLeads'
import LeadCard from '../components/leads/LeadCard'
import LeadForm from '../components/leads/LeadForm'
import KanbanBoard from '../components/leads/KanbanBoard'
import { PIPELINE_STAGES, STAGE_BY_ID } from '../constants/pipelineStages'
import { LEAD_SOURCES } from '../constants/leadSources'
import { FULL_ACCESS_ROLES } from '../constants/roles'
import { insforge } from '../insforge'

export default function Leads() {
  const { profile } = useAuthContext()
  const { leads, isLoading, fetchLeads, addLead, updateLead, checkDuplicate } = useLeads(profile)

  // Default: list on mobile, kanban on desktop
  const [view,        setView]        = useState(() => window.innerWidth < 768 ? 'list' : 'kanban')
  const [search,      setSearch]      = useState('')
  const [filters,     setFilters]     = useState({})
  const [showFilters, setShowFilters] = useState(false)
  const [formOpen,    setFormOpen]    = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [refreshKey,  setRefreshKey]  = useState(0)
  const [projects,    setProjects]    = useState([])
  const [agents,      setAgents]      = useState([])

  const navigate  = useNavigate()
  const canSeeAll = profile && FULL_ACCESS_ROLES.includes(profile.role)

  useEffect(() => {
    insforge.database.from('projects').select('id, name').eq('is_active', true)
      .then(({ data }) => setProjects(data || []))
    if (canSeeAll) {
      insforge.database.from('user_profiles').select('id, full_name').eq('is_active', true)
        .then(({ data }) => setAgents(data || []))
    }
  }, [canSeeAll])

  useEffect(() => {
    const activeFilters = { ...filters }
    if (search) activeFilters.search = search
    fetchLeads(activeFilters)
  }, [filters, search, fetchLeads, refreshKey])

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      if (!value) { const next = { ...prev }; delete next[key]; return next }
      return { ...prev, [key]: value }
    })
  }

  const handleSave = () => { setFormOpen(false); setEditingLead(null); setRefreshKey(k => k + 1) }
  const openEdit  = (lead) => { setEditingLead(lead); setFormOpen(true) }
  const openAdd   = ()     => { setEditingLead(null);  setFormOpen(true) }

  const activeFilterCount = Object.keys(filters).length

  return (
    <Layout title="Leads">

      {/* ── Page header ────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-black tracking-tight gradient-text">Leads</h1>
          {!isLoading && (
            <p className="text-xs mt-0.5" style={{ color: 'rgba(0,0,0,0.38)' }}>
              {leads.length} {leads.length === 1 ? 'lead' : 'leads'}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle — hidden on mobile */}
          <div className="hidden sm:flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(27,58,107,0.2)' }}>
            <button
              onClick={() => setView('kanban')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
              style={{
                backgroundColor: view === 'kanban' ? '#1B3A6B' : 'transparent',
                color: view === 'kanban' ? '#ffffff' : 'rgba(27,58,107,0.6)',
              }}
            >
              <LayoutGrid size={13} /> Board
            </button>
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
              style={{
                backgroundColor: view === 'list' ? '#1B3A6B' : 'transparent',
                color: view === 'list' ? '#ffffff' : 'rgba(27,58,107,0.6)',
                borderLeft: '1px solid rgba(27,58,107,0.2)',
              }}
            >
              <List size={13} /> List
            </button>
          </div>

          {/* Add Lead — desktop */}
          <button
            onClick={openAdd}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-semibold cursor-pointer transition-colors"
            style={{ backgroundColor: '#1B3A6B' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#162840'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1B3A6B'}
          >
            <Plus size={15} /> Add Lead
          </button>
        </div>
      </div>

      {/* ── Search + filter row ─────────────────────────── */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(0,0,0,0.3)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or mobile…"
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl transition-shadow"
            style={{
              background: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(27,58,107,0.15)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
              style={{ color: 'rgba(0,0,0,0.3)' }}
            >
              <X size={13} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
          style={{
            background: activeFilterCount > 0 ? 'rgba(27,58,107,0.10)' : 'rgba(255,255,255,0.85)',
            border: activeFilterCount > 0 ? '1px solid rgba(27,58,107,0.3)' : '1px solid rgba(27,58,107,0.15)',
            color: activeFilterCount > 0 ? '#1B3A6B' : 'rgba(0,0,0,0.45)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <SlidersHorizontal size={14} />
          <span className="hidden sm:inline">Filter</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center text-white" style={{ backgroundColor: '#1B3A6B' }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Filter panel ────────────────────────────────── */}
      {showFilters && (
        <div
          className="mb-4 p-3 rounded-2xl space-y-2"
          style={{
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(27,58,107,0.12)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              {
                value: filters.stage || '',
                onChange: v => handleFilterChange('stage', v),
                placeholder: 'All Stages',
                options: PIPELINE_STAGES.map(s => ({ id: s.id, label: s.label })),
              },
              {
                value: filters.source || '',
                onChange: v => handleFilterChange('source', v),
                placeholder: 'All Sources',
                options: LEAD_SOURCES.map(s => ({ id: s.id, label: s.label })),
              },
              {
                value: filters.project_id || '',
                onChange: v => handleFilterChange('project_id', v),
                placeholder: 'All Projects',
                options: projects.map(p => ({ id: p.id, label: p.name })),
              },
              ...(canSeeAll ? [{
                value: filters.assigned_to || '',
                onChange: v => handleFilterChange('assigned_to', v),
                placeholder: 'All Agents',
                options: agents.map(a => ({ id: a.id, label: a.full_name })),
              }] : []),
            ].map((f, i) => (
              <select
                key={i}
                value={f.value}
                onChange={e => f.onChange(e.target.value)}
                className="rounded-xl px-2.5 py-2 text-xs font-medium cursor-pointer"
                style={{
                  border: '1px solid rgba(27,58,107,0.15)',
                  background: 'rgba(255,255,255,0.9)',
                  color: f.value ? '#1B3A6B' : 'rgba(0,0,0,0.45)',
                }}
              >
                <option value="">{f.placeholder}</option>
                {f.options.map(o => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            ))}
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={() => setFilters({})}
              className="w-full text-xs font-semibold cursor-pointer py-1"
              style={{ color: '#AA2222' }}
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* ── Loading skeletons ───────────────────────────── */}
      {isLoading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/80 rounded-2xl overflow-hidden" style={{ borderLeft: '3px solid #e2e8f0' }}>
              <div className="p-4">
                <div className="flex justify-between mb-2">
                  <div className="h-4 bg-gray-200 rounded-full w-1/3" />
                  <div className="h-5 bg-gray-100 rounded-full w-20" />
                </div>
                <div className="h-3 bg-gray-100 rounded-full w-1/4 mb-3" />
                <div className="flex gap-1.5">
                  <div className="h-5 bg-gray-100 rounded-full w-20" />
                  <div className="h-5 bg-gray-100 rounded-full w-16" />
                </div>
              </div>
              <div className="h-10 bg-gray-50 border-t border-gray-100" />
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────── */}
      {!isLoading && view === 'list' && leads.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(27,58,107,0.08)', border: '1px solid rgba(27,58,107,0.12)' }}
          >
            <Search size={26} style={{ color: '#1B3A6B', opacity: 0.5 }} />
          </div>
          <h3 className="text-base font-bold text-gray-800">
            {search || activeFilterCount > 0 ? 'No matches found' : 'No leads yet'}
          </h3>
          <p className="text-sm mt-1 mb-5" style={{ color: 'rgba(0,0,0,0.38)' }}>
            {search || activeFilterCount > 0
              ? 'Try adjusting your search or filters.'
              : 'Add your first lead to get started.'}
          </p>
          {!search && activeFilterCount === 0 && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold cursor-pointer"
              style={{ backgroundColor: '#1B3A6B' }}
            >
              <Plus size={14} /> Add First Lead
            </button>
          )}
        </div>
      )}

      {/* ── Kanban board ────────────────────────────────── */}
      {!isLoading && view === 'kanban' && (
        <KanbanBoard
          leads={leads}
          updateLead={updateLead}
          onEdit={openEdit}
          onAddLead={openAdd}
          onUpdate={() => setRefreshKey(k => k + 1)}
        />
      )}

      {/* ── List view ───────────────────────────────────── */}
      {!isLoading && view === 'list' && leads.length > 0 && (
        <>
          {/* Desktop — horizontal rows */}
          <div className="hidden md:flex flex-col gap-2">
            {leads.map(lead => {
              const stage      = STAGE_BY_ID[lead.pipeline_stage] || {}
              const source     = LEAD_SOURCES.find(s => s.id === lead.source)
              const isOverdue  = lead.follow_up_at && isPast(new Date(lead.follow_up_at)) && !isToday(new Date(lead.follow_up_at))
              const isDueToday = lead.follow_up_at && isToday(new Date(lead.follow_up_at))
              const stageColor = stage.color || '#1B3A6B'
              const initials   = lead.full_name ? lead.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?'
              const waNumber   = lead.mobile.replace(/\D/g, '')
              const waMsg      = encodeURIComponent(`Hi ${lead.full_name}, this is from Ranav Group. `)

              return (
                <div
                  key={lead.id}
                  style={{
                    background: 'rgba(255,255,255,0.82)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255,255,255,0.72)',
                    borderLeft: `3px solid ${stageColor}70`,
                    borderRadius: 16,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    transition: 'box-shadow 0.18s ease, transform 0.18s ease',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  {/* Avatar */}
                  <div style={{ padding: '12px 10px 12px 14px', flexShrink: 0 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 12,
                      background: `linear-gradient(135deg, ${stageColor}CC 0%, ${stageColor}99 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: '0.04em',
                      border: '1.5px solid rgba(255,255,255,0.55)',
                    }}>
                      {initials}
                    </div>
                  </div>

                  {/* Name + mobile */}
                  <div style={{ width: 190, flexShrink: 0, padding: '0 10px 0 2px' }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#0F1E3C', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>
                      {lead.full_name}
                    </p>
                    <p style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', marginTop: 2, fontWeight: 500 }}>
                      {lead.mobile}
                    </p>
                  </div>

                  {/* Stage badge */}
                  <div style={{ width: 140, flexShrink: 0, padding: '0 8px' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
                      backgroundColor: `${stageColor}12`, color: stageColor,
                      letterSpacing: '0.04em', border: `1px solid ${stageColor}22`,
                      whiteSpace: 'nowrap',
                    }}>
                      {stage.label || lead.pipeline_stage}
                    </span>
                  </div>

                  {/* Source + agent + project badges */}
                  <div style={{ flex: 1, minWidth: 0, padding: '0 8px', display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                    {source && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99, backgroundColor: 'rgba(27,58,107,0.07)', color: '#1B3A6B', whiteSpace: 'nowrap' }}>
                        {source.label}
                      </span>
                    )}
                    {canSeeAll && lead.assigned_agent?.full_name && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99, backgroundColor: 'rgba(201,146,42,0.09)', color: '#8A6010', whiteSpace: 'nowrap' }}>
                        {lead.assigned_agent.full_name}
                      </span>
                    )}
                    {lead.project?.name && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99, backgroundColor: 'rgba(26,122,58,0.08)', color: '#1A7A3A', whiteSpace: 'nowrap' }}>
                        {lead.project.name}
                      </span>
                    )}
                  </div>

                  {/* Follow-up */}
                  <div style={{ width: 178, flexShrink: 0, padding: '0 10px' }}>
                    {lead.follow_up_at ? (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '4px 8px', borderRadius: 8,
                        backgroundColor: isOverdue ? 'rgba(170,34,34,0.07)' : isDueToday ? 'rgba(201,146,42,0.08)' : 'rgba(15,30,60,0.04)',
                        border: `1px solid ${isOverdue ? 'rgba(170,34,34,0.16)' : isDueToday ? 'rgba(201,146,42,0.18)' : 'rgba(15,30,60,0.07)'}`,
                      }}>
                        <CalendarClock size={11} style={{ color: isOverdue ? '#AA2222' : isDueToday ? '#C9922A' : 'rgba(15,30,60,0.3)', flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: isOverdue ? '#AA2222' : isDueToday ? '#C9922A' : 'rgba(15,30,60,0.42)', whiteSpace: 'nowrap' }}>
                          {format(new Date(lead.follow_up_at), 'dd MMM, h:mm a')}
                        </span>
                        {isOverdue && <span style={{ fontSize: 8, fontWeight: 900, padding: '1px 5px', borderRadius: 99, backgroundColor: '#AA2222', color: '#fff', letterSpacing: '0.05em' }}>OVERDUE</span>}
                        {isDueToday && <span style={{ fontSize: 8, fontWeight: 900, padding: '1px 5px', borderRadius: 99, backgroundColor: '#C9922A', color: '#fff', letterSpacing: '0.05em' }}>TODAY</span>}
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.22)' }}>—</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div
                    style={{ display: 'flex', alignItems: 'stretch', borderLeft: '1px solid rgba(15,30,60,0.06)', flexShrink: 0 }}
                    onClick={e => e.stopPropagation()}
                  >
                    {[
                      { href: `tel:${lead.mobile}`,                       label: 'Call',     icon: Phone,         color: '#1A7A3A', bg: 'rgba(26,122,58,0.07)' },
                      { href: `https://wa.me/${waNumber}?text=${waMsg}`,  label: 'WhatsApp', icon: MessageCircle, color: '#059669', bg: 'rgba(5,150,105,0.07)', external: true },
                    ].map(({ href, label, icon: Icon, color, bg, external }) => (
                      <a
                        key={label}
                        href={href}
                        target={external ? '_blank' : undefined}
                        rel={external ? 'noopener noreferrer' : undefined}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '0 14px', fontSize: 11, fontWeight: 700, color,
                          textDecoration: 'none', transition: 'background 0.13s',
                          borderRight: '1px solid rgba(15,30,60,0.06)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = bg}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Icon size={13} /> {label}
                      </a>
                    ))}
                    <button
                      onClick={() => openEdit(lead)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '0 14px', fontSize: 11, fontWeight: 700, color: '#1B3A6B',
                        background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.13s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(27,58,107,0.07)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Pencil size={13} /> Edit
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mobile — LeadCard grid */}
          <div className="md:hidden space-y-3">
            {leads.map(lead => (
              <LeadCard key={lead.id} lead={lead} onEdit={openEdit} />
            ))}
          </div>
        </>
      )}

      {/* ── Mobile FAB ──────────────────────────────────── */}
      <button
        onClick={openAdd}
        className="sm:hidden fixed bottom-24 right-4 z-30 w-14 h-14 rounded-2xl flex items-center justify-center text-white cursor-pointer"
        style={{
          backgroundColor: '#1B3A6B',
          boxShadow: '0 8px 24px rgba(27,58,107,0.45), 0 2px 8px rgba(0,0,0,0.2)',
        }}
        aria-label="Add lead"
      >
        <Plus size={22} />
      </button>

      {/* Lead Form modal */}
      {formOpen && (
        <LeadForm
          lead={editingLead}
          onClose={() => { setFormOpen(false); setEditingLead(null) }}
          onSave={handleSave}
          addLead={addLead}
          updateLead={updateLead}
          checkDuplicate={checkDuplicate}
        />
      )}
    </Layout>
  )
}
