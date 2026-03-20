import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, SlidersHorizontal, LayoutGrid, List } from 'lucide-react'
import { format, isPast } from 'date-fns'
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

  const [view,         setView]         = useState('kanban')   // 'kanban' | 'list'
  const [search,       setSearch]       = useState('')
  const [filters,      setFilters]      = useState({})
  const [showFilters,  setShowFilters]  = useState(false)
  const [formOpen,     setFormOpen]     = useState(false)
  const [editingLead,  setEditingLead]  = useState(null)
  const [refreshKey,   setRefreshKey]   = useState(0)
  const [projects,     setProjects]     = useState([])
  const [agents,       setAgents]       = useState([])

  const navigate  = useNavigate()
  const canSeeAll = profile && FULL_ACCESS_ROLES.includes(profile.role)

  // Load filter dropdowns
  useEffect(() => {
    insforge.database.from('projects').select('id, name').eq('is_active', true)
      .then(({ data }) => setProjects(data || []))
    if (canSeeAll) {
      insforge.database.from('user_profiles').select('id, full_name').eq('is_active', true)
        .then(({ data }) => setAgents(data || []))
    }
  }, [canSeeAll])

  // Fetch leads on filter / search / refresh change
  useEffect(() => {
    const activeFilters = { ...filters }
    if (search) activeFilters.search = search
    fetchLeads(activeFilters)
  }, [filters, search, fetchLeads, refreshKey])

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      if (!value) {
        const next = { ...prev }
        delete next[key]
        return next
      }
      return { ...prev, [key]: value }
    })
  }

  const handleSave = () => {
    setFormOpen(false)
    setEditingLead(null)
    setRefreshKey(k => k + 1)
  }

  const openEdit = (lead) => { setEditingLead(lead); setFormOpen(true) }
  const openAdd  = ()     => { setEditingLead(null);  setFormOpen(true) }

  const activeFilterCount = Object.keys(filters).length

  return (
    <Layout title="Leads">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-brand-blue">Leads</h1>
          {!isLoading && (
            <p className="text-sm text-gray-500">
              {leads.length} {leads.length === 1 ? 'lead' : 'leads'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1 px-3 py-2 text-sm ${view === 'kanban' ? 'bg-brand-blue text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              title="Kanban view"
            >
              <LayoutGrid size={15} />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1 px-3 py-2 text-sm border-l border-gray-300 ${view === 'list' ? 'bg-brand-blue text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              title="List view"
            >
              <List size={15} />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-brand-blue/90 active:bg-brand-blue"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Lead</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or mobile…"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
          />
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
            activeFilterCount > 0
              ? 'border-brand-blue bg-brand-blue/5 text-brand-blue'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal size={15} />
          <span className="hidden sm:inline">Filter</span>
          {activeFilterCount > 0 && (
            <span className="bg-brand-blue text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Expanded filter panel */}
      {showFilters && (
        <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <select
              value={filters.stage || ''}
              onChange={e => handleFilterChange('stage', e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
            >
              <option value="">All Stages</option>
              {PIPELINE_STAGES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>

            <select
              value={filters.source || ''}
              onChange={e => handleFilterChange('source', e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
            >
              <option value="">All Sources</option>
              {LEAD_SOURCES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>

            <select
              value={filters.project_id || ''}
              onChange={e => handleFilterChange('project_id', e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {canSeeAll && (
              <select
                value={filters.assigned_to || ''}
                onChange={e => handleFilterChange('assigned_to', e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
              >
                <option value="">All Agents</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.full_name}</option>
                ))}
              </select>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={() => setFilters({})}
              className="mt-2 w-full text-xs text-red-500 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="flex justify-between mb-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
              <div className="h-3 bg-gray-100 rounded w-1/4 mb-3" />
              <div className="flex gap-2">
                <div className="h-8 bg-gray-100 rounded flex-1" />
                <div className="h-8 bg-gray-100 rounded flex-1" />
                <div className="h-8 bg-gray-100 rounded flex-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state — list view only */}
      {!isLoading && view === 'list' && leads.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center mb-4">
            <Plus size={28} className="text-brand-blue" />
          </div>
          <h3 className="text-base font-semibold text-gray-800">No leads found</h3>
          <p className="text-sm text-gray-400 mt-1 mb-4">
            {search || activeFilterCount > 0
              ? 'No leads match your current filters.'
              : 'Add your first lead to get started.'}
          </p>
          {!search && activeFilterCount === 0 && (
            <button
              onClick={openAdd}
              className="px-4 py-2 bg-brand-blue text-white rounded-lg text-sm font-medium"
            >
              Add First Lead
            </button>
          )}
        </div>
      )}

      {/* Kanban board */}
      {!isLoading && view === 'kanban' && (
        <KanbanBoard
          leads={leads}
          updateLead={updateLead}
          onEdit={openEdit}
          onAddLead={openAdd}
          onUpdate={() => setRefreshKey(k => k + 1)}
        />
      )}

      {/* List view — desktop table + mobile cards */}
      {!isLoading && view === 'list' && leads.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Mobile</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Source</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Stage</th>
                  {canSeeAll && <th className="px-4 py-3 font-medium text-gray-600">Agent</th>}
                  <th className="px-4 py-3 font-medium text-gray-600">Follow-up</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => {
                  const stage     = STAGE_BY_ID[lead.pipeline_stage] || {}
                  const source    = LEAD_SOURCES.find(s => s.id === lead.source)
                  const isOverdue = lead.follow_up_at && isPast(new Date(lead.follow_up_at))
                  return (
                    <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                      <td className="px-4 py-3 font-medium text-gray-900 cursor-pointer hover:text-brand-blue" onClick={() => navigate(`/leads/${lead.id}`)}>{lead.full_name}</td>
                      <td className="px-4 py-3 text-gray-600">{lead.mobile}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{source?.label || '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs text-white font-medium"
                          style={{ backgroundColor: stage.color }}
                        >
                          {stage.label || lead.pipeline_stage}
                        </span>
                      </td>
                      {canSeeAll && (
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {lead.assigned_agent?.full_name || '—'}
                        </td>
                      )}
                      <td className={`px-4 py-3 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {lead.follow_up_at
                          ? format(new Date(lead.follow_up_at), 'dd MMM, h:mm a')
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3 text-xs font-medium">
                          <a href={`tel:${lead.mobile}`} className="text-green-600 hover:text-green-700">
                            Call
                          </a>
                          <a
                            href={`https://wa.me/${lead.mobile.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            WhatsApp
                          </a>
                          <button onClick={() => openEdit(lead)} className="text-blue-600 hover:text-blue-700">
                            Edit
                          </button>
                          <button onClick={() => navigate(`/leads/${lead.id}`)} className="text-brand-blue hover:text-brand-blue/70">
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {leads.map(lead => (
              <LeadCard key={lead.id} lead={lead} onEdit={openEdit} />
            ))}
          </div>
        </>
      )}

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
