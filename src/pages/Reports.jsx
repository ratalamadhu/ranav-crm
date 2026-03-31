import { useState, useEffect } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, Users, Target, AlertCircle, Award, PhoneCall } from 'lucide-react'
import Layout from '../components/layout/Layout'
import { useAuthContext } from '../context/AuthContext'
import { insforge } from '../insforge'
import { PIPELINE_STAGES } from '../constants/pipelineStages'
import { LEAD_SOURCES, LOST_REASONS } from '../constants/leadSources'
import { CAN_VIEW_REPORTS } from '../constants/roles'

// ── Palette ───────────────────────────────────────────────────────────────────
const COLORS = ['#1B3A6B','#C9922A','#1A7A3A','#AA2222','#7C3AED','#0891B2','#BE185D','#92400E']

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}, ${color}CC)`,
      borderRadius: 16, padding: '18px 20px', position: 'relative', overflow: 'hidden',
      boxShadow: `0 6px 20px ${color}33`,
    }}>
      <div style={{ position: 'absolute', right: -8, bottom: -8, opacity: 0.12 }}>
        <Icon size={72} color="#fff" strokeWidth={1.5} />
      </div>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', margin: 0 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '6px 0 4px', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{sub}</p>
    </div>
  )
}

// ── Section card wrapper ──────────────────────────────────────────────────────
function Section({ title, children, style = {} }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', ...style }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9' }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: '16px 20px 20px' }}>{children}</div>
    </div>
  )
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1E293B', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>
      <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0 0', color: p.color || '#fff' }}>{p.name}: <b>{p.value}</b></p>
      ))}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Reports() {
  const { profile } = useAuthContext()
  const [leads, setLeads]       = useState([])
  const [agents, setAgents]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [period, setPeriod]     = useState('all')  // 'all' | 'month' | 'week'

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [{ data: leadsData }, { data: agentsData }] = await Promise.all([
          insforge.database.from('leads').select('*').eq('is_deleted', false),
          insforge.database.from('user_profiles').select('id, full_name, role').eq('is_active', true),
        ])
        setLeads(leadsData || [])
        setAgents(agentsData || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!CAN_VIEW_REPORTS.includes(profile?.role)) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94A3B8' }}>
          <p>Access restricted.</p>
        </div>
      </Layout>
    )
  }

  // ── Filter by period ───────────────────────────────────────────────────────
  const now = new Date()
  const filtered = leads.filter(l => {
    if (period === 'all') return true
    const d = new Date(l.created_at)
    if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    if (period === 'week') { const diff = (now - d) / 86400000; return diff <= 7 }
    return true
  })

  // ── Summary stats ─────────────────────────────────────────────────────────
  const total      = filtered.length
  const bookings   = filtered.filter(l => l.pipeline_stage === 'booking_done').length
  const siteVisits = filtered.filter(l => ['site_visit_scheduled','site_visit_done'].includes(l.pipeline_stage)).length
  const lost       = filtered.filter(l => l.pipeline_stage === 'lost').length
  const convRate   = total > 0 ? ((bookings / total) * 100).toFixed(1) : '0'
  const overdueFollowups = leads.filter(l =>
    l.follow_up_at && new Date(l.follow_up_at) < now && l.pipeline_stage !== 'booking_done' && l.pipeline_stage !== 'lost' && !l.is_deleted
  ).length

  // ── Pipeline funnel data ───────────────────────────────────────────────────
  const pipelineData = PIPELINE_STAGES.map(s => ({
    name: s.label,
    count: filtered.filter(l => l.pipeline_stage === s.id).length,
    color: s.color,
  })).filter(d => d.count > 0)

  // ── Source breakdown ───────────────────────────────────────────────────────
  const sourceData = LEAD_SOURCES.map((s, i) => ({
    name: s.label,
    value: filtered.filter(l => l.source === s.id).length,
    color: COLORS[i % COLORS.length],
  })).filter(d => d.value > 0)

  // ── Agent leaderboard ─────────────────────────────────────────────────────
  const agentMap = {}
  agents.forEach(a => { agentMap[a.id] = a.full_name })
  const agentStats = Object.entries(
    filtered.reduce((acc, l) => {
      const id = l.assigned_to || 'unassigned'
      if (!acc[id]) acc[id] = { total: 0, bookings: 0, visits: 0, name: agentMap[id] || 'Unassigned' }
      acc[id].total++
      if (l.pipeline_stage === 'booking_done') acc[id].bookings++
      if (['site_visit_scheduled','site_visit_done'].includes(l.pipeline_stage)) acc[id].visits++
      return acc
    }, {})
  ).map(([, v]) => v).sort((a, b) => b.bookings - a.bookings || b.total - a.total)

  // ── Lost reasons ──────────────────────────────────────────────────────────
  const lostLeads = filtered.filter(l => l.pipeline_stage === 'lost')
  const lostData = LOST_REASONS.map((r, i) => ({
    name: r,
    value: lostLeads.filter(l => l.lost_reason === r).length,
    color: COLORS[i % COLORS.length],
  })).filter(d => d.value > 0)

  // ── Monthly trend (last 6 months) ─────────────────────────────────────────
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const m = d.getMonth(), y = d.getFullYear()
    const monthLeads = leads.filter(l => {
      const ld = new Date(l.created_at)
      return ld.getMonth() === m && ld.getFullYear() === y && !l.is_deleted
    })
    return {
      name: monthNames[m],
      Leads: monthLeads.length,
      Bookings: monthLeads.filter(l => l.pipeline_stage === 'booking_done').length,
    }
  })

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94A3B8' }}>
          Loading reports...
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ padding: '24px 24px 60px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Header + period filter */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Reports</h1>
            <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>Sales performance overview</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['all','All Time'],['month','This Month'],['week','This Week']].map(([key, label]) => (
              <button key={key} onClick={() => setPeriod(key)} style={{
                padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${period === key ? '#1B3A6B' : '#E2E8F0'}`,
                background: period === key ? '#1B3A6B' : '#fff', color: period === key ? '#fff' : '#64748B',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: 24 }}>
          <StatCard label="Total Leads"       value={total}          sub={`${period === 'month' ? 'this month' : period === 'week' ? 'this week' : 'all time'}`} color="#1B3A6B" icon={Users} />
          <StatCard label="Bookings Done"     value={bookings}       sub={`${convRate}% conversion`} color="#1A7A3A" icon={Award} />
          <StatCard label="Site Visits"       value={siteVisits}     sub="scheduled + done"          color="#C9922A" icon={Target} />
          <StatCard label="Lost Leads"        value={lost}           sub={`${total > 0 ? ((lost/total)*100).toFixed(0) : 0}% of total`} color="#AA2222" icon={TrendingUp} />
          <StatCard label="Overdue Followups" value={overdueFollowups} sub="needs attention"         color="#7C3AED" icon={AlertCircle} />
        </div>

        {/* Row: Pipeline funnel + Source pie */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

          <Section title="Pipeline Funnel">
            {pipelineData.length === 0 ? (
              <p style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No lead data</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={pipelineData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Leads" radius={[0, 6, 6, 0]}>
                    {pipelineData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Section>

          <Section title="Leads by Source">
            {sourceData.length === 0 ? (
              <p style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${name.split('/')[0].trim()} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {sourceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Section>
        </div>

        {/* Monthly trend */}
        <div style={{ marginBottom: 20 }}>
          <Section title="Monthly Trend — Last 6 Months">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Leads"    fill="#1B3A6B" radius={[4,4,0,0]} />
                <Bar dataKey="Bookings" fill="#1A7A3A" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>

        {/* Row: Agent leaderboard + Lost reasons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          <Section title="Agent Leaderboard">
            {agentStats.length === 0 ? (
              <p style={{ color: '#94A3B8', fontSize: 13 }}>No data</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F1F5F9' }}>
                    {['Agent', 'Leads', 'Visits', 'Bookings'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Agent' ? 'left' : 'center', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agentStats.map((a, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1E293B' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {i === 0 && <span style={{ fontSize: 14 }}>🥇</span>}
                          {i === 1 && <span style={{ fontSize: 14 }}>🥈</span>}
                          {i === 2 && <span style={{ fontSize: 14 }}>🥉</span>}
                          {i > 2 && <span style={{ width: 22, display: 'inline-block' }} />}
                          {a.name}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#1B3A6B', fontWeight: 700 }}>{a.total}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#C9922A', fontWeight: 600 }}>{a.visits}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{ background: a.bookings > 0 ? '#F0FDF4' : '#F8FAFC', color: a.bookings > 0 ? '#1A7A3A' : '#94A3B8', fontWeight: 700, padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>
                          {a.bookings}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          <Section title="Lost Reasons">
            {lostData.length === 0 ? (
              <p style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No lost leads {period !== 'all' ? 'in this period' : ''}</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={lostData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                      {lostData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8 }}>
                  {lostData.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < lostData.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#475569' }}>{d.name}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Section>

        </div>
      </div>
    </Layout>
  )
}
