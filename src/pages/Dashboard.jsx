import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, isToday, isPast, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Phone, TrendingUp, Users, CalendarClock, CheckCircle, AlertTriangle } from 'lucide-react'
import Layout from '../components/layout/Layout'
import { useAuthContext } from '../context/AuthContext'
import { insforge } from '../insforge'
import { PIPELINE_STAGES } from '../constants/pipelineStages'
import { LEAD_SOURCES } from '../constants/leadSources'
import { FULL_ACCESS_ROLES } from '../constants/roles'

// ── Colour palette for charts ─────────────────────────────────────────────
const SOURCE_COLORS = ['#1B3A6B','#C9922A','#1A7A3A','#AA2222','#3B82F6','#8B5CF6','#F59E0B']

// ── Premium stat card ─────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, alert = false, accent = '#1B3A6B' }) {
  const color = alert ? '#AA2222' : accent
  return (
    <div
      className="relative overflow-hidden cursor-default"
      style={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}BB 100%)`,
        borderRadius: 20,
        padding: '20px 20px 18px',
        boxShadow: `0 8px 24px ${color}44, 0 2px 6px rgba(0,0,0,0.10)`,
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 16px 40px ${color}55, 0 4px 10px rgba(0,0,0,0.14)`; e.currentTarget.style.transform = 'translateY(-3px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 8px 24px ${color}44, 0 2px 6px rgba(0,0,0,0.10)`; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Top highlight shimmer */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, transparent 100%)', borderRadius: '20px 20px 0 0', pointerEvents: 'none' }} />
      {/* Watermark icon */}
      <div style={{ position: 'absolute', right: -10, bottom: -10, pointerEvents: 'none', opacity: 0.13 }}>
        <Icon size={88} color="#ffffff" strokeWidth={1.5} />
      </div>

      {/* Content */}
      <div style={{ position: 'relative' }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.62)', margin: 0 }}>
          {label}
        </p>
        <p style={{ fontSize: 42, fontWeight: 900, lineHeight: 1, marginTop: 8, color: '#ffffff', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>
          {value}
        </p>
        {sub && (
          <p style={{ fontSize: 11, marginTop: 6, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{sub}</p>
        )}
      </div>
    </div>
  )
}

// ── Section card header ───────────────────────────────────────────────────
function SectionHeader({ title, accentColor = '#1B3A6B', right }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px',
        background: `linear-gradient(135deg, ${accentColor}0A 0%, transparent 100%)`,
        borderBottom: `1px solid ${accentColor}14`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 3, height: 16, borderRadius: 99, backgroundColor: accentColor, flexShrink: 0 }} />
        <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0F1E3C', letterSpacing: '-0.01em', margin: 0 }}>{title}</h3>
      </div>
      {right}
    </div>
  )
}

// ── Shared helper ─────────────────────────────────────────────────────────
function actorInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

// ── Glass card style ──────────────────────────────────────────────────────
const glassCard = {
  background: 'rgba(255,255,255,0.78)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.7)',
  borderRadius: 20,
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 0.5px 2px rgba(0,0,0,0.04)',
}

// ── Custom bar tooltip ────────────────────────────────────────────────────
function CustomBarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2">
      <p className="text-xs font-semibold text-gray-800">{payload[0].payload.name}</p>
      <p className="text-lg font-black tabular-nums" style={{ color: payload[0].fill || '#1B3A6B' }}>
        {payload[0].value}
      </p>
    </div>
  )
}

// ── MD / Admin / Director dashboard ──────────────────────────────────────
function AdminDashboard() {
  const navigate = useNavigate()
  const [stats,     setStats]     = useState(null)
  const [funnelData, setFunnelData] = useState([])
  const [sourceData, setSourceData] = useState([])
  const [overdue,   setOverdue]   = useState([])
  const [activity,  setActivity]  = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const now        = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()
      const monthStart = startOfMonth(now).toISOString()
      const monthEnd   = endOfMonth(now).toISOString()

      const [allLeads, activityRes] = await Promise.all([
        insforge.database
          .from('leads')
          .select('id, full_name, mobile, pipeline_stage, source, follow_up_at, created_at, assigned_agent:user_profiles!leads_assigned_to_fkey(full_name)')
          .eq('is_deleted', false),
        insforge.database
          .from('activity_log')
          .select('*, actor:user_profiles!activity_log_performed_by_fkey(full_name)')
          .order('created_at', { ascending: false })
          .limit(20),
      ])

      const leads = allLeads.data || []

      const newToday     = leads.filter(l => l.created_at >= todayStart && l.created_at <= todayEnd).length
      const followToday  = leads.filter(l => l.follow_up_at && isToday(new Date(l.follow_up_at))).length
      const overdueLeads = leads.filter(l => l.follow_up_at && isPast(new Date(l.follow_up_at)) && !isToday(new Date(l.follow_up_at)))
      const visitsToday  = leads.filter(l => l.pipeline_stage === 'site_visit_scheduled' && l.follow_up_at && isToday(new Date(l.follow_up_at))).length
      const bookings     = leads.filter(l => l.pipeline_stage === 'booking_done' && l.created_at >= monthStart && l.created_at <= monthEnd).length

      setStats({ newToday, followToday, overdueCount: overdueLeads.length, visitsToday, bookings })

      setFunnelData(
        PIPELINE_STAGES.map(s => ({
          name:  s.label,
          count: leads.filter(l => l.pipeline_stage === s.id).length,
          fill:  s.color,
        }))
      )

      const srcMap = {}
      leads.forEach(l => { if (l.source) srcMap[l.source] = (srcMap[l.source] || 0) + 1 })
      setSourceData(
        LEAD_SOURCES
          .filter(s => srcMap[s.id])
          .map(s => ({ name: s.label, value: srcMap[s.id] }))
      )

      setOverdue(
        overdueLeads
          .sort((a, b) => new Date(a.follow_up_at) - new Date(b.follow_up_at))
          .slice(0, 10)
      )
      setActivity(activityRes.data || [])
      setIsLoading(false)
    }
    load()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white/80 rounded-2xl" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-64 bg-white/80 rounded-2xl" />
          <div className="h-64 bg-white/80 rounded-2xl" />
        </div>
      </div>
    )
  }

  const STAGE_LABELS = {
    new_lead:'New Lead', contacted:'Contacted', site_visit_scheduled:'Visit Scheduled',
    site_visit_done:'Visit Done', negotiation:'Negotiation', booking_done:'Booking Done', lost:'Lost',
  }

  function activityText(entry) {
    if (!entry.new_value) return 'updated a lead'
    try {
      const val = JSON.parse(entry.new_value)
      if (val.created)          return `added lead "${val.full_name}"${val.assigned_to_name ? ` → ${val.assigned_to_name}` : ''}`
      if (val.pipeline_stage) {
        const to   = STAGE_LABELS[val.pipeline_stage]     || val.pipeline_stage
        const from = STAGE_LABELS[val.old_pipeline_stage] || null
        return from ? `moved lead from "${from}" → "${to}"` : `moved lead to "${to}"`
      }
      if (val.assigned_to_name) return `assigned lead to ${val.assigned_to_name}`
      if (val.lost_reason)      return `marked lead as lost: ${val.lost_reason}`
      return 'updated a lead'
    } catch {
      return entry.new_value
    }
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="New leads today"     value={stats.newToday}    icon={Users}         accent="#1B3A6B" />
        <StatCard label="Follow-ups today"    value={stats.followToday} icon={CalendarClock} alert={stats.followToday > 0} />
        <StatCard label="Site visits today"   value={stats.visitsToday} icon={TrendingUp}    accent="#C9922A" />
        <StatCard label="Bookings this month" value={stats.bookings}    icon={CheckCircle}   accent="#1A7A3A" />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Pipeline funnel */}
        <div style={glassCard}>
          <SectionHeader title="Pipeline Overview" accentColor="#1B3A6B" />
          <div style={{ padding: '8px 8px 16px' }}>
            <ResponsiveContainer width="100%" height={228}>
              <BarChart data={funnelData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={115} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={18}>
                  {funnelData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leads by source */}
        <div style={glassCard}>
          <SectionHeader title="Leads by Source" accentColor="#C9922A" />
          <div style={{ padding: '8px 8px 16px' }}>
            {sourceData.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 228, gap: 8 }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(15,30,60,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={22} style={{ color: 'rgba(15,30,60,0.2)' }} />
                </div>
                <p style={{ fontSize: 13, color: 'rgba(15,30,60,0.35)' }}>No source data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={228}>
                <PieChart>
                  <Pie
                    data={sourceData} dataKey="value" nameKey="name"
                    cx="50%" cy="48%" outerRadius={78} innerRadius={32}
                    paddingAngle={2}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {sourceData.map((_, i) => <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />)}
                  </Pie>
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                  <Tooltip formatter={(v, name) => [v, name]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Overdue follow-ups */}
      {overdue.length > 0 && (
        <div style={{ ...glassCard, borderTop: '3px solid #AA2222' }}>
          {/* Custom overdue header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'linear-gradient(135deg, rgba(170,34,34,0.06) 0%, transparent 100%)', borderBottom: '1px solid rgba(170,34,34,0.10)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(170,34,34,0.10)', border: '1px solid rgba(170,34,34,0.15)' }}>
                <AlertTriangle size={14} style={{ color: '#AA2222' }} />
              </div>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0F1E3C', letterSpacing: '-0.01em', margin: 0 }}>Overdue Follow-ups</h3>
              <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, backgroundColor: '#AA2222', color: '#fff', letterSpacing: '0.04em' }}>
                {overdue.length}
              </span>
            </div>
          </div>
          <div>
            {overdue.map((lead, idx) => {
              const daysAgo = Math.floor((Date.now() - new Date(lead.follow_up_at)) / 86400000)
              return (
                <div
                  key={lead.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 18px', cursor: 'pointer',
                    borderBottom: idx < overdue.length - 1 ? '1px solid rgba(170,34,34,0.07)' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(170,34,34,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    {/* Avatar */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                      background: 'linear-gradient(135deg, #AA2222DD 0%, #AA2222 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: '0.04em',
                      boxShadow: '0 3px 8px rgba(170,34,34,0.28)',
                      border: '2px solid rgba(255,255,255,0.6)',
                    }}>
                      {actorInitials(lead.full_name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0F1E3C', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lead.full_name}
                      </p>
                      <p style={{ fontSize: 11, marginTop: 2, color: 'rgba(15,30,60,0.4)', fontWeight: 500 }}>
                        {lead.assigned_agent?.full_name || 'Unassigned'}
                        <span style={{ marginLeft: 6, fontWeight: 700, color: '#AA2222' }}>
                          · {daysAgo === 0 ? 'today' : `${daysAgo}d overdue`}
                        </span>
                      </p>
                    </div>
                  </div>
                  <a
                    href={`tel:${lead.mobile}`}
                    onClick={e => e.stopPropagation()}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, backgroundColor: 'rgba(26,122,58,0.10)', color: '#1A7A3A', textDecoration: 'none', flexShrink: 0, border: '1px solid rgba(26,122,58,0.15)' }}
                  >
                    <Phone size={11} /> Call
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div style={glassCard}>
        <SectionHeader title="Recent Activity" accentColor="#8B5CF6" />
        {activity.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(15,30,60,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={22} style={{ color: 'rgba(15,30,60,0.2)' }} />
            </div>
            <p style={{ fontSize: 13, color: 'rgba(15,30,60,0.35)' }}>No activity yet</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {activity.map((entry, idx) => {
              // Cycle avatar accent colors based on action type
              const avatarColors = ['#1B3A6B', '#C9922A', '#1A7A3A', '#8B5CF6', '#AA2222']
              const avatarColor = avatarColors[idx % avatarColors.length]
              return (
                <li
                  key={entry.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 18px',
                    borderBottom: idx < activity.length - 1 ? '1px solid rgba(15,30,60,0.05)' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,30,60,0.025)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 11, flexShrink: 0,
                    background: `linear-gradient(135deg, ${avatarColor}DD 0%, ${avatarColor} 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '0.04em',
                    boxShadow: `0 3px 8px ${avatarColor}30`,
                    border: '2px solid rgba(255,255,255,0.6)',
                    marginTop: 1,
                  }}>
                    {actorInitials(entry.actor?.full_name)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: 'rgba(15,30,60,0.7)', margin: 0, lineHeight: 1.45 }}>
                      <span style={{ fontWeight: 700, color: '#0F1E3C' }}>{entry.actor?.full_name || 'Someone'}</span>
                      {' '}{activityText(entry)}
                    </p>
                    <p style={{ fontSize: 11, marginTop: 3, color: 'rgba(15,30,60,0.35)', fontWeight: 500 }}>
                      {format(new Date(entry.created_at), 'dd MMM, h:mm a')}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

// ── Agent personal dashboard ──────────────────────────────────────────────
function AgentDashboard({ profile }) {
  const navigate    = useNavigate()
  const [data,      setData]      = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const now        = new Date()
      const monthStart = startOfMonth(now).toISOString()
      const monthEnd   = endOfMonth(now).toISOString()
      const lastStart  = startOfMonth(subMonths(now, 1)).toISOString()
      const lastEnd    = endOfMonth(subMonths(now, 1)).toISOString()

      const { data: leads } = await insforge.database
        .from('leads')
        .select('id, full_name, mobile, pipeline_stage, follow_up_at, created_at')
        .eq('is_deleted', false)
        .eq('assigned_to', profile.id)

      const all = leads || []

      const todayFollowUps = all.filter(l => l.follow_up_at && isToday(new Date(l.follow_up_at)))
      const overdueLeads   = all.filter(l => l.follow_up_at && isPast(new Date(l.follow_up_at)) && !isToday(new Date(l.follow_up_at)))
      const thisMonth      = all.filter(l => l.created_at >= monthStart && l.created_at <= monthEnd).length
      const lastMonth      = all.filter(l => l.created_at >= lastStart && l.created_at <= lastEnd).length

      const pipeline = PIPELINE_STAGES.map(s => ({
        name:  s.label,
        count: all.filter(l => l.pipeline_stage === s.id).length,
        color: s.color,
      })).filter(s => s.count > 0)

      setData({ todayFollowUps, overdueLeads, thisMonth, lastMonth, pipeline, total: all.length })
      setIsLoading(false)
    }
    load()
  }, [profile.id])

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white/80 rounded-2xl" />)}
        </div>
        <div className="h-48 bg-white/80 rounded-2xl" />
      </div>
    )
  }

  const delta = data.thisMonth - data.lastMonth

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="My total leads"    value={data.total}                     icon={Users}         accent="#1B3A6B" />
        <StatCard label="Leads this month"  value={data.thisMonth}                 icon={TrendingUp}    accent="#C9922A"
          sub={delta >= 0 ? `+${delta} vs last month` : `${delta} vs last month`} />
        <StatCard label="Follow-ups today"  value={data.todayFollowUps.length}     icon={CalendarClock} alert={data.todayFollowUps.length > 0} />
        <StatCard label="Overdue"           value={data.overdueLeads.length}       icon={AlertTriangle} alert={data.overdueLeads.length > 0} />
      </div>

      {/* Today's follow-ups */}
      {data.todayFollowUps.length > 0 && (
        <div style={{ ...glassCard, borderTop: '3px solid #C9922A' }}>
          <SectionHeader title="Today's Follow-ups" accentColor="#C9922A" />
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {data.todayFollowUps.map((lead, idx) => (
              <li
                key={lead.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 18px', cursor: 'pointer',
                  borderBottom: idx < data.todayFollowUps.length - 1 ? '1px solid rgba(201,146,42,0.08)' : 'none',
                  transition: 'background 0.15s',
                }}
                onClick={() => navigate(`/leads/${lead.id}`)}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,146,42,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                    background: 'linear-gradient(135deg, #C9922ADD 0%, #C9922A 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 12, fontWeight: 800,
                    boxShadow: '0 3px 8px rgba(201,146,42,0.28)',
                    border: '2px solid rgba(255,255,255,0.6)',
                  }}>
                    {actorInitials(lead.full_name)}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0F1E3C', margin: 0 }}>{lead.full_name}</p>
                    <p style={{ fontSize: 11, marginTop: 2, color: 'rgba(15,30,60,0.4)', fontWeight: 500 }}>
                      {format(new Date(lead.follow_up_at), 'h:mm a')}
                    </p>
                  </div>
                </div>
                <a
                  href={`tel:${lead.mobile}`}
                  onClick={e => e.stopPropagation()}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, backgroundColor: 'rgba(26,122,58,0.10)', color: '#1A7A3A', textDecoration: 'none', flexShrink: 0, border: '1px solid rgba(26,122,58,0.15)' }}
                >
                  <Phone size={11} /> Call
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Overdue */}
      {data.overdueLeads.length > 0 && (
        <div style={{ ...glassCard, borderTop: '3px solid #AA2222' }}>
          <SectionHeader
            title="Overdue"
            accentColor="#AA2222"
            right={
              <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, backgroundColor: '#AA2222', color: '#fff', letterSpacing: '0.04em' }}>
                {data.overdueLeads.length}
              </span>
            }
          />
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {data.overdueLeads.slice(0, 5).map((lead, idx) => (
              <li
                key={lead.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 18px', cursor: 'pointer',
                  borderBottom: idx < Math.min(data.overdueLeads.length, 5) - 1 ? '1px solid rgba(170,34,34,0.07)' : 'none',
                  transition: 'background 0.15s',
                }}
                onClick={() => navigate(`/leads/${lead.id}`)}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(170,34,34,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                    background: 'linear-gradient(135deg, #AA2222DD 0%, #AA2222 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 12, fontWeight: 800,
                    boxShadow: '0 3px 8px rgba(170,34,34,0.28)',
                    border: '2px solid rgba(255,255,255,0.6)',
                  }}>
                    {actorInitials(lead.full_name)}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0F1E3C', margin: 0 }}>{lead.full_name}</p>
                    <p style={{ fontSize: 11, marginTop: 2, fontWeight: 600, color: '#AA2222' }}>
                      {format(new Date(lead.follow_up_at), 'dd MMM')}
                    </p>
                  </div>
                </div>
                <a
                  href={`tel:${lead.mobile}`}
                  onClick={e => e.stopPropagation()}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, backgroundColor: 'rgba(26,122,58,0.10)', color: '#1A7A3A', textDecoration: 'none', flexShrink: 0, border: '1px solid rgba(26,122,58,0.15)' }}
                >
                  <Phone size={11} /> Call
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* My pipeline */}
      {data.pipeline.length > 0 && (
        <div style={glassCard}>
          <SectionHeader title="My Pipeline" accentColor="#1B3A6B" />
          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.pipeline.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(15,30,60,0.5)', width: 120, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                <div style={{ flex: 1, backgroundColor: 'rgba(15,30,60,0.07)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                  <div
                    style={{ width: `${Math.max(4, (s.count / data.total) * 100)}%`, height: '100%', borderRadius: 99, backgroundColor: s.color, transition: 'width 0.5s ease' }}
                  />
                </div>
                <span style={{ fontSize: 12, fontWeight: 900, fontVariantNumeric: 'tabular-nums', width: 20, textAlign: 'right', color: s.color }}>
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Dashboard page ───────────────────────────────────────────────────
export default function Dashboard() {
  const { profile } = useAuthContext()
  const isFullAccess = profile && FULL_ACCESS_ROLES.includes(profile.role)
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <Layout title="Dashboard">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight gradient-text">
          {greeting}{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(0,0,0,0.38)' }}>
          {format(new Date(), 'EEEE, dd MMMM yyyy')}
        </p>
      </div>

      {isFullAccess
        ? <AdminDashboard />
        : <AgentDashboard profile={profile} />
      }
    </Layout>
  )
}
