import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, IndianRupee, Home, CheckCircle2, Clock, X, ChevronDown, Save, Trash2, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import { useAuthContext } from '../context/AuthContext'
import { insforge } from '../insforge'
import { PLOTS_RAW } from '../constants/plotsData'
import { MANAGER_ROLES } from '../constants/roles'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const FACING = { E: 'East', W: 'West', S: 'South', N: 'North' }
const FACING_COLOR = {
  E: { bg: 'rgba(46,204,113,0.15)',  color: '#2ECC71', border: 'rgba(46,204,113,0.35)' },
  W: { bg: 'rgba(241,196,15,0.15)',  color: '#F1C40F', border: 'rgba(241,196,15,0.35)' },
  S: { bg: 'rgba(231,76,60,0.15)',   color: '#E74C3C', border: 'rgba(231,76,60,0.35)' },
  N: { bg: 'rgba(52,152,219,0.15)',  color: '#3498DB', border: 'rgba(52,152,219,0.35)' },
}
const STATUS_STYLE = {
  available: { bg: '#F0FDF4', border: '#86EFAC', color: '#166534', label: 'Available' },
  booked:    { bg: '#FEFCE8', border: '#FDE047', color: '#854D0E', label: 'Booked' },
  sold:      { bg: '#FEF2F2', border: '#FCA5A5', color: '#991B1B', label: 'Sold' },
}

function fmt(n) {
  if (!n) return '—'
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)} L`
  return `₹${Number(n).toLocaleString('en-IN')}`
}

// ─── Revenue Summary Bar ─────────────────────────────────────────────────────
function SummaryBar({ inventory }) {
  const sold   = inventory.filter(p => p.status === 'sold')
  const booked = inventory.filter(p => p.status === 'booked')
  const totalRevenue = sold.reduce((s, p) => s + (Number(p.sale_price) || 0), 0)
  const pipeline     = booked.reduce((s, p) => s + (Number(p.sale_price) || 0), 0)
  const advCollected = booked.reduce((s, p) => s + (Number(p.advance_paid) || 0), 0)
  const avgPrice     = sold.length ? Math.round(totalRevenue / sold.length) : 0

  const cards = [
    { label: 'Total Plots',      value: '282',              sub: `${282 - sold.length - booked.length} available`, color: '#1B3A6B', icon: Home },
    { label: 'Sold',             value: sold.length,         sub: sold.length ? fmt(totalRevenue) : 'No sales yet', color: '#AA2222', icon: CheckCircle2 },
    { label: 'Booked',           value: booked.length,       sub: booked.length ? `${fmt(advCollected)} advance collected` : 'None booked', color: '#C9922A', icon: Clock },
    { label: 'Total Revenue',    value: fmt(totalRevenue),   sub: avgPrice ? `Avg ${fmt(avgPrice)} / plot` : 'No sales yet', color: '#1A7A3A', icon: IndianRupee },
    { label: 'Pipeline (Booked)', value: fmt(pipeline),      sub: booked.length ? `${booked.length} plots` : '—', color: '#7C3AED', icon: TrendingUp },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
      {cards.map(({ label, value, sub, color, icon: Icon }) => (
        <div key={label} style={{
          background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
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
      ))}
    </div>
  )
}

// ─── Plot Grid ───────────────────────────────────────────────────────────────
function PlotGrid({ inventory, onPlotClick, filter }) {
  const byPlot = {}
  inventory.forEach(p => { byPlot[p.plot_no] = p })

  const visible = filter === 'all'
    ? PLOTS_RAW
    : PLOTS_RAW.filter(([n]) => {
        const inv = byPlot[n]
        const status = inv?.status || 'available'
        return status === filter
      })

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
      gap: 8,
    }}>
      {visible.map(([n, f, sqft]) => {
        const inv = byPlot[n]
        const status = inv?.status || 'available'
        const fc = FACING_COLOR[f] || FACING_COLOR.E
        const sc = STATUS_STYLE[status]

        return (
          <button
            key={n}
            onClick={() => onPlotClick(n, f, sqft, inv)}
            title={`Plot ${n} · ${FACING[f]} · ${sqft.toLocaleString()} sqft · ${sc.label}${inv?.buyer_name ? ' · ' + inv.buyer_name : ''}`}
            style={{
              background: status === 'available' ? '#fff' : sc.bg,
              border: `1.5px solid ${status === 'available' ? '#E2E8F0' : sc.border}`,
              borderRadius: 10,
              padding: '8px 4px 6px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s',
              boxShadow: status !== 'available' ? `0 2px 8px ${sc.border}66` : 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = status !== 'available' ? `0 2px 8px ${sc.border}66` : 'none' }}
          >
            <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: status === 'available' ? '#1E293B' : sc.color }}>{n}</span>
            <span style={{ display: 'block', fontSize: 9, color: status === 'available' ? '#94A3B8' : sc.color, opacity: 0.8, marginTop: 1 }}>{sqft.toLocaleString()}</span>
            <span style={{
              display: 'inline-block', marginTop: 3, fontSize: 8, fontWeight: 700,
              padding: '1px 5px', borderRadius: 4,
              background: fc.bg, color: fc.color, border: `1px solid ${fc.border}`,
              letterSpacing: '0.3px',
            }}>{f}</span>
            {status !== 'available' && (
              <span style={{ display: 'block', fontSize: 8, fontWeight: 700, color: sc.color, marginTop: 2, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                {sc.label}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Plot Detail Modal ────────────────────────────────────────────────────────
function PlotModal({ plotNo, facing, sqft, existing, onClose, onSave, onClear, saving }) {
  const [status, setStatus]       = useState(existing?.status || 'available')
  const [buyerName, setBuyerName] = useState(existing?.buyer_name || '')
  const [salePrice, setSalePrice] = useState(existing?.sale_price || '')
  const [advance, setAdvance]     = useState(existing?.advance_paid || '')
  const [saleDate, setSaleDate]   = useState(existing?.sale_date || new Date().toISOString().slice(0, 10))
  const [notes, setNotes]         = useState(existing?.notes || '')

  const fc = FACING_COLOR[facing] || FACING_COLOR.E
  const needsBuyer = status === 'sold' || status === 'booked'

  function handleSave() {
    if (needsBuyer && !buyerName.trim()) { toast.error('Please enter buyer name'); return }
    if (needsBuyer && !salePrice) { toast.error('Please enter sale price'); return }
    onSave({ status, buyer_name: buyerName.trim() || null, sale_price: salePrice ? Number(salePrice) : null, advance_paid: advance ? Number(advance) : null, sale_date: saleDate || null, notes: notes.trim() || null })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 24px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1B3A6B, #0F2347)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: '#C9922A', borderRadius: 10, padding: '6px 14px', fontSize: 18, fontWeight: 800, color: '#fff' }}>
                {plotNo}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0 }}>Plot {plotNo}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{sqft.toLocaleString()} sqft</p>
              </div>
              <span style={{ marginLeft: 4, padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: fc.bg, color: fc.color, border: `1px solid ${fc.border}` }}>
                {FACING[facing]} Facing
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '20px 24px 24px', overflowY: 'auto', maxHeight: '70vh' }}>

          {/* Status */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Status</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {['available', 'booked', 'sold'].map(s => {
                const sc = STATUS_STYLE[s]
                const active = status === s
                return (
                  <button key={s} onClick={() => setStatus(s)} style={{
                    padding: '10px 8px', borderRadius: 10, border: `2px solid ${active ? sc.border : '#E2E8F0'}`,
                    background: active ? sc.bg : '#F8FAFC', cursor: 'pointer', transition: 'all 0.15s',
                    color: active ? sc.color : '#64748B', fontWeight: active ? 700 : 500, fontSize: 13,
                  }}>
                    {sc.label}
                  </button>
                )
              })}
            </div>
          </div>

          {needsBuyer && (
            <>
              {/* Buyer Name */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Buyer Name *</label>
                <input value={buyerName} onChange={e => setBuyerName(e.target.value)}
                  placeholder="Full name of buyer"
                  style={inputStyle} />
              </div>

              {/* Sale Price + Advance */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Sale Price (₹) *</label>
                  <input type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)}
                    placeholder="e.g. 2100000"
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>{status === 'booked' ? 'Advance Paid (₹)' : 'Final Amount (₹)'}</label>
                  <input type="number" value={advance} onChange={e => setAdvance(e.target.value)}
                    placeholder={status === 'booked' ? 'Advance amount' : 'Same as sale price'}
                    style={inputStyle} />
                </div>
              </div>

              {/* Sale Date */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>{status === 'booked' ? 'Booking Date' : 'Sale Date'}</label>
                <input type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} style={inputStyle} />
              </div>
            </>
          )}

          {/* Notes */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Notes / Log</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Any remarks, payment schedule, conditions..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSave} disabled={saving} style={{
              flex: 1, padding: '12px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #1B3A6B, #2A5298)', color: '#fff',
              fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: saving ? 0.7 : 1,
            }}>
              <Save size={15} /> {saving ? 'Saving...' : 'Save'}
            </button>
            {existing && existing.status !== 'available' && (
              <button onClick={onClear} style={{
                padding: '12px 16px', borderRadius: 10, border: '1.5px solid #FCA5A5',
                background: '#FEF2F2', color: '#991B1B', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Trash2 size={14} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const labelStyle = { fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 14, color: '#1E293B', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#FAFAFA' }

// ─── Sales List ──────────────────────────────────────────────────────────────
function SalesList({ inventory, onPlotClick }) {
  const active = inventory.filter(p => p.status === 'sold' || p.status === 'booked')
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'sold' ? -1 : 1
      return new Date(b.updated_at) - new Date(a.updated_at)
    })

  if (!active.length) return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
      <FileText size={40} strokeWidth={1} style={{ margin: '0 auto 12px' }} />
      <p style={{ fontSize: 14 }}>No sold or booked plots yet</p>
    </div>
  )

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#F1F5F9' }}>
            {['Plot', 'Facing', 'Sqft', 'Status', 'Buyer', 'Sale Price', 'Advance Paid', 'Date', 'Notes'].map(h => (
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {active.map(row => {
            const plotRaw = PLOTS_RAW.find(([n]) => n === row.plot_no) || []
            const [, f, sqft] = plotRaw
            const sc = STATUS_STYLE[row.status]
            const fc = FACING_COLOR[f] || FACING_COLOR.E
            return (
              <tr key={row.plot_no}
                onClick={() => onPlotClick(row.plot_no, f, sqft, row)}
                style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1E293B' }}>{row.plot_no}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700, background: fc.bg, color: fc.color, border: `1px solid ${fc.border}` }}>
                    {FACING[f] || f}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{sqft?.toLocaleString()}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                    {sc.label}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1E293B' }}>{row.buyer_name || '—'}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1A7A3A' }}>{fmt(row.sale_price)}</td>
                <td style={{ padding: '12px 14px', color: '#C9922A', fontWeight: 600 }}>{fmt(row.advance_paid)}</td>
                <td style={{ padding: '12px 14px', color: '#64748B', whiteSpace: 'nowrap' }}>{row.sale_date ? new Date(row.sale_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                <td style={{ padding: '12px 14px', color: '#64748B', maxWidth: 200 }}>
                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.notes || '—'}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Inventory() {
  const { profile } = useAuthContext()
  const [inventory, setInventory] = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(null)   // { plotNo, facing, sqft, existing }
  const [saving, setSaving]       = useState(false)
  const [filter, setFilter]       = useState('all')

  // Guard: MD/Admin only
  if (!MANAGER_ROLES.includes(profile?.role)) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94A3B8' }}>
          <Home size={48} strokeWidth={1} style={{ marginBottom: 16 }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: '#1E293B' }}>Access Restricted</p>
          <p style={{ fontSize: 13 }}>Inventory is visible to Admin and MD only.</p>
        </div>
      </Layout>
    )
  }

  const fetchInventory = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await insforge
        .from('plot_inventory')
        .select('*')
        .neq('status', 'available')
      if (error) throw error
      setInventory(data || [])
    } catch (e) {
      console.error(e)
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchInventory() }, [fetchInventory])

  function openModal(plotNo, facing, sqft, existing) {
    setModal({ plotNo, facing, sqft, existing: existing || null })
  }

  async function handleSave(formData) {
    if (!modal) return
    setSaving(true)
    try {
      const payload = { plot_no: modal.plotNo, ...formData, updated_by: profile.id }
      // Upsert — plot_no is unique key
      const { error } = await insforge
        .from('plot_inventory')
        .upsert(payload, { onConflict: 'plot_no' })
      if (error) throw error
      toast.success(`Plot ${modal.plotNo} updated`)
      setModal(null)
      await fetchInventory()
    } catch (e) {
      console.error(e)
      toast.error('Failed to save: ' + (e.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  async function handleClear() {
    if (!modal) return
    if (!confirm(`Mark Plot ${modal.plotNo} as available and clear all details?`)) return
    setSaving(true)
    try {
      const { error } = await insforge
        .from('plot_inventory')
        .delete()
        .eq('plot_no', modal.plotNo)
      if (error) throw error
      toast.success(`Plot ${modal.plotNo} marked available`)
      setModal(null)
      await fetchInventory()
    } catch (e) {
      toast.error('Failed to clear')
    } finally {
      setSaving(false)
    }
  }

  const filterBtns = [
    { key: 'all',       label: 'All Plots',  count: 282 },
    { key: 'available', label: 'Available',  count: 282 - inventory.length },
    { key: 'booked',    label: 'Booked',     count: inventory.filter(p => p.status === 'booked').length },
    { key: 'sold',      label: 'Sold',       count: inventory.filter(p => p.status === 'sold').length },
  ]

  return (
    <Layout>
      <div style={{ padding: '24px 24px 60px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Page Title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Plot Inventory</h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>Anvaya Grove — 282 Plots · Click any plot to mark sold / booked</p>
        </div>

        {/* Summary */}
        <SummaryBar inventory={inventory} />

        {/* Plot Grid Section */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', marginBottom: 24, overflow: 'hidden' }}>
          {/* Section header + filters */}
          <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0 }}>Plot Map</h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {filterBtns.map(({ key, label, count }) => (
                <button key={key} onClick={() => setFilter(key)} style={{
                  padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${filter === key ? '#1B3A6B' : '#E2E8F0'}`,
                  background: filter === key ? '#1B3A6B' : '#fff', color: filter === key ? '#fff' : '#64748B',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>
                  {label} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ padding: '10px 20px 6px', display: 'flex', gap: 16, flexWrap: 'wrap', borderBottom: '1px solid #F8FAFC' }}>
            {[
              { label: 'Available', color: '#E2E8F0', text: '#64748B' },
              { label: 'Booked',    color: '#FDE047', text: '#854D0E' },
              { label: 'Sold',      color: '#FCA5A5', text: '#991B1B' },
              { label: 'E = East',  color: '#86EFAC', text: '#166534' },
              { label: 'W = West',  color: '#FDE047', text: '#854D0E' },
              { label: 'S = South', color: '#FCA5A5', text: '#991B1B' },
            ].map(({ label, color, text }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                <span style={{ fontSize: 11, color: '#64748B' }}>{label}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: '16px 20px 20px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>Loading...</div>
            ) : (
              <PlotGrid inventory={inventory} onPlotClick={openModal} filter={filter} />
            )}
          </div>
        </div>

        {/* Sales & Bookings Table */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0 }}>
              Sold & Booked — {inventory.filter(p => p.status !== 'available').length} plots
            </h2>
          </div>
          <SalesList inventory={inventory} onPlotClick={openModal} />
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <PlotModal
          plotNo={modal.plotNo}
          facing={modal.facing}
          sqft={modal.sqft}
          existing={modal.existing}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onClear={handleClear}
          saving={saving}
        />
      )}
    </Layout>
  )
}
