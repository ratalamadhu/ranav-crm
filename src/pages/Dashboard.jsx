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

// ── Colour palette for pie chart ──────────────────────────────────────────
const SOURCE_COLORS = ['#1B3A6B','#C9922A','#1A7A3A','#AA2222','#3B82F6','#8B5CF6','#F59E0B']

// ── Small reusable stat card ──────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color = 'brand-blue', alert = false }) {
  return (
    <div className={`bg-white rounded-xl border p-4 flex items-start gap-3 ${alert ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
      <div className={`p-2 rounded-lg ${alert ? 'bg-red-100' : 'bg-brand-blue/10'}`}>
        <Icon size={18} className={alert ? 'text-red-600' : 'text-brand-blue'} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-2xl font-bold ${alert ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── MD / Admin / Director dashboard ──────────────────────────────────────
function AdminDashboard() {
  const navigate = useNavigate()
  const [stats,        setStats]        = useState(null)
  const [funnelData,   setFunnelData]   = useState([])
  const [sourceData,   setSourceData]   = useState([])
  const [overdue,      setOverdue]      = useState([])
  const [activity,     setActivity]     = useState([])
  const [isLoading,    setIsLoading]    = useState(true)

  useEffect(() => {
    async function load() {
      const now       = new Date()
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

      // Summary stats
      const newToday     = leads.filter(l => l.created_at >= todayStart && l.created_at <= todayEnd).length
      const followToday  = leads.filter(l => l.follow_up_at && isToday(new Date(l.follow_up_at))).length
      const overdueLeads = leads.filter(l => l.follow_up_at && isPast(new Date(l.follow_up_at)) && !isToday(new Date(l.follow_up_at)))
      const visitsToday  = leads.filter(l => l.pipeline_stage === 'site_visit_scheduled' && l.follow_up_at && isToday(new Date(l.follow_up_at))).length
      const bookings     = leads.filter(l => l.pipeline_stage === 'booking_done' && l.created_at >= monthStart && l.created_at <= monthEnd).length

      setStats({ newToday, followToday, overdueCount: overdueLeads.length, visitsToday, bookings })

      // Funnel data
      setFunnelData(
        PIPELINE_STAGES.map(s => ({
          name:  s.label,
          count: leads.filter(l => l.pipeline_stage === s.id).length,
          fill:  s.color,
        }))
      )

      // Source data
      const srcMap = {}
      leads.forEach(l => {
        if (l.source) srcMap[l.source] = (srcMap[l.source] || 0) + 1
      })
      setSourceData(
        LEAD_SOURCES
          .filter(s => srcMap[s.id])
          .map(s => ({ name: s.label, value: srcMap[s.id] }))
      )

      // Overdue sorted
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
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-56 bg-gray-100 rounded-xl" />
          <div className="h-56 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  function activityText(entry) {
    if (!entry.new_value) return `${entry.action_type} on ${entry.entity_type}`
    try {
      const val = JSON.parse(entry.new_value)
      if (val.pipeline_stage) return `moved lead to "${val.pipeline_stage.replace(/_/g,' ')}"`
      if (entry.action_type === 'create') return `added a new lead`
      return `updated a lead`
    } catch {
      return entry.new_value
    }
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="New leads today"       value={stats.newToday}     icon={Users}         />
        <StatCard label="Follow-ups today"      value={stats.followToday}  icon={CalendarClock} alert={stats.followToday > 0} />
        <StatCard label="Site visits today"     value={stats.visitsToday}  icon={TrendingUp}    />
        <StatCard label="Bookings this month"   value={stats.bookings}     icon={CheckCircle}   />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Pipeline funnel */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Pipeline Overview</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={funnelData} layout="vertical" margin={{ left: 16, right: 16 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [v, 'Leads']} />
              <Bar dataKey="count" radius={[0,4,4,0]}>
                {funnelData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leads by source */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Leads by Source</h3>
          {sourceData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {sourceData.map((_, i) => <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />)}
                </Pie>
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Overdue follow-ups */}
      {overdue.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border-b border-red-100">
            <AlertTriangle size={15} className="text-red-600" />
            <h3 className="text-sm font-semibold text-red-700">Overdue Follow-ups ({overdue.length})</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {overdue.map(lead => {
              const daysAgo = Math.floor((Date.now() - new Date(lead.follow_up_at)) / 86400000)
              return (
                <div key={lead.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50">
                  <div>
                    <p
                      className="text-sm font-medium text-gray-900 cursor-pointer hover:text-brand-blue"
                      onClick={() => navigate(`/leads/${lead.id}`)}
                    >
                      {lead.full_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {lead.assigned_agent?.full_name || 'Unassigned'} · {daysAgo === 0 ? 'Today' : `${daysAgo}d overdue`}
                    </p>
                  </div>
                  <a
                    href={`tel:${lead.mobile}`}
                    className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium"
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Recent Activity</h3>
        </div>
        {activity.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No activity yet</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {activity.map(entry => (
              <li key={entry.id} className="flex items-start gap-3 px-4 py-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-blue mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{entry.actor?.full_name || 'Someone'}</span>{' '}
                    {activityText(entry)}
                  </p>
                  <p className="text-xs text-gray-400">{format(new Date(entry.created_at), 'dd MMM, h:mm a')}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ── Agent personal dashboard ──────────────────────────────────────────────
function AgentDashboard({ profile }) {
  const navigate   = useNavigate()
  const [data,     setData]     = useState(null)
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
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
        </div>
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  const delta = data.thisMonth - data.lastMonth

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="My total leads"       value={data.total}      icon={Users}         />
        <StatCard label="Leads this month"     value={data.thisMonth}  icon={TrendingUp}    sub={delta >= 0 ? `+${delta} vs last month` : `${delta} vs last month`} />
        <StatCard label="Follow-ups today"     value={data.todayFollowUps.length}  icon={CalendarClock} alert={data.todayFollowUps.length > 0} />
        <StatCard label="Overdue"              value={data.overdueLeads.length}    icon={AlertTriangle} alert={data.overdueLeads.length > 0} />
      </div>

      {/* Today's follow-ups */}
      {data.todayFollowUps.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Today's Follow-ups</h3>
          </div>
          <ul className="divide-y divide-gray-50">
            {data.todayFollowUps.map(lead => (
              <li key={lead.id} className="flex items-center justify-between px-4 py-2.5">
                <p
                  className="text-sm font-medium text-gray-900 cursor-pointer hover:text-brand-blue"
                  onClick={() => navigate(`/leads/${lead.id}`)}
                >
                  {lead.full_name}
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    {format(new Date(lead.follow_up_at), 'h:mm a')}
                  </span>
                </p>
                <a
                  href={`tel:${lead.mobile}`}
                  className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium"
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
        <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border-b border-red-100">
            <AlertTriangle size={14} className="text-red-600" />
            <h3 className="text-sm font-semibold text-red-700">Overdue ({data.overdueLeads.length})</h3>
          </div>
          <ul className="divide-y divide-gray-50">
            {data.overdueLeads.slice(0, 5).map(lead => (
              <li key={lead.id} className="flex items-center justify-between px-4 py-2.5">
                <p
                  className="text-sm font-medium text-gray-900 cursor-pointer hover:text-brand-blue"
                  onClick={() => navigate(`/leads/${lead.id}`)}
                >
                  {lead.full_name}
                  <span className="ml-2 text-xs text-red-400 font-normal">
                    {format(new Date(lead.follow_up_at), 'dd MMM')}
                  </span>
                </p>
                <a
                  href={`tel:${lead.mobile}`}
                  className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium"
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
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">My Pipeline</h3>
          <div className="space-y-2">
            {data.pipeline.map(s => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-32 truncate">{s.name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${Math.max(4, (s.count / data.total) * 100)}%`, backgroundColor: s.color }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-4 text-right">{s.count}</span>
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
      <div className="mb-5">
        <h1 className="text-xl font-bold text-brand-blue">
          {greeting}{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-sm text-gray-400">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
      </div>

      {isFullAccess
        ? <AdminDashboard />
        : <AgentDashboard profile={profile} />
      }
    </Layout>
  )
}
