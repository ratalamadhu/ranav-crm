import { useState, useEffect, useCallback, useRef } from 'react'
import { TrendingUp, IndianRupee, Home, CheckCircle2, Clock, X, Save, Trash2, FileText, Building2, Lock, ChevronDown, Upload, Download, AlertCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import { useAuthContext } from '../context/AuthContext'
import { insforge } from '../insforge'
import { PLOTS_RAW } from '../constants/plotsData'
import { ARYA_UNITS, ARYA_FLOORS, ARYA_TOTAL_UNITS, BLOCK_TYPES, aryaUnitId } from '../constants/aryaData'
import { MANAGER_ROLES } from '../constants/roles'

// ─── Shared helpers ───────────────────────────────────────────────────────────
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
const BLOCK_STYLE = {
  available:        { bg: '#F0FDF4', border: '#86EFAC', color: '#166534', label: 'Available' },
  blocked:          { bg: '#EEF2FF', border: '#A5B4FC', color: '#3730A3', label: 'Blocked' },
  sold:             { bg: '#FEF2F2', border: '#FCA5A5', color: '#991B1B', label: 'Sold' },
}
const BLOCK_TYPE_COLOR = {
  'Presales':        { bg: 'rgba(139,92,246,0.12)', color: '#6D28D9', border: 'rgba(139,92,246,0.30)' },
  'EOI':             { bg: 'rgba(249,115,22,0.12)', color: '#C2410C', border: 'rgba(249,115,22,0.30)' },
  'Agent Block':     { bg: 'rgba(59,130,246,0.12)', color: '#1D4ED8', border: 'rgba(59,130,246,0.30)' },
  'Management Hold': { bg: 'rgba(71,85,105,0.12)',  color: '#334155', border: 'rgba(71,85,105,0.30)' },
}

function fmt(n) {
  if (!n) return '—'
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)} L`
  return `₹${Number(n).toLocaleString('en-IN')}`
}

const labelStyle = {
  fontSize: 11, fontWeight: 600, color: '#64748B',
  textTransform: 'uppercase', letterSpacing: '0.08em',
  display: 'block', marginBottom: 5,
}
const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1.5px solid #E2E8F0', fontSize: 14, color: '#1E293B',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#FAFAFA',
}

// ═══════════════════════════════════════════════════════
// ANVAYA GROVE — Plot Inventory
// ═══════════════════════════════════════════════════════

function SummaryBar({ inventory }) {
  const sold   = inventory.filter(p => p.status === 'sold')
  const booked = inventory.filter(p => p.status === 'booked')
  const totalRevenue = sold.reduce((s, p) => s + (Number(p.sale_price) || 0), 0)
  const pipeline     = booked.reduce((s, p) => s + (Number(p.sale_price) || 0), 0)
  const advCollected = booked.reduce((s, p) => s + (Number(p.advance_paid) || 0), 0)
  const avgPrice     = sold.length ? Math.round(totalRevenue / sold.length) : 0

  const cards = [
    { label: 'Total Plots',       value: '282',            sub: `${282 - sold.length - booked.length} available`, color: '#1B3A6B', icon: Home },
    { label: 'Sold',              value: sold.length,       sub: sold.length ? fmt(totalRevenue) : 'No sales yet', color: '#AA2222', icon: CheckCircle2 },
    { label: 'Booked',            value: booked.length,     sub: booked.length ? `${fmt(advCollected)} advance` : 'None booked', color: '#C9922A', icon: Clock },
    { label: 'Total Revenue',     value: fmt(totalRevenue), sub: avgPrice ? `Avg ${fmt(avgPrice)} / plot` : 'No sales yet', color: '#1A7A3A', icon: IndianRupee },
    { label: 'Pipeline (Booked)', value: fmt(pipeline),     sub: booked.length ? `${booked.length} plots` : '—', color: '#7C3AED', icon: TrendingUp },
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

function PlotGrid({ inventory, onPlotClick, filter }) {
  const byPlot = {}
  inventory.forEach(p => { byPlot[p.plot_no] = p })

  const visible = filter === 'all'
    ? PLOTS_RAW
    : PLOTS_RAW.filter(([n]) => {
        const status = byPlot[n]?.status || 'available'
        return status === filter
      })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 8 }}>
      {visible.map(([n, f, sqft]) => {
        const inv    = byPlot[n]
        const status = inv?.status || 'available'
        const fc     = FACING_COLOR[f] || FACING_COLOR.E
        const sc     = STATUS_STYLE[status]
        return (
          <button key={n} onClick={() => onPlotClick(n, f, sqft, inv)}
            title={`Plot ${n} · ${FACING[f]} · ${sqft.toLocaleString()} sqft · ${sc.label}${inv?.buyer_name ? ' · ' + inv.buyer_name : ''}`}
            style={{
              background: status === 'available' ? '#fff' : sc.bg,
              border: `1.5px solid ${status === 'available' ? '#E2E8F0' : sc.border}`,
              borderRadius: 10, padding: '8px 4px 6px', cursor: 'pointer',
              textAlign: 'center', transition: 'all 0.15s',
              boxShadow: status !== 'available' ? `0 2px 8px ${sc.border}66` : 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = status !== 'available' ? `0 2px 8px ${sc.border}66` : 'none' }}
          >
            <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: status === 'available' ? '#1E293B' : sc.color }}>{n}</span>
            <span style={{ display: 'block', fontSize: 9, color: status === 'available' ? '#94A3B8' : sc.color, opacity: 0.8, marginTop: 1 }}>{sqft.toLocaleString()}</span>
            <span style={{ display: 'inline-block', marginTop: 3, fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: fc.bg, color: fc.color, border: `1px solid ${fc.border}`, letterSpacing: '0.3px' }}>{f}</span>
            {status !== 'available' && (
              <span style={{ display: 'block', fontSize: 8, fontWeight: 700, color: sc.color, marginTop: 2, letterSpacing: '0.3px', textTransform: 'uppercase' }}>{sc.label}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

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
        <div style={{ background: 'linear-gradient(135deg, #1B3A6B, #0F2347)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#C9922A', borderRadius: 10, padding: '6px 14px', fontSize: 18, fontWeight: 800, color: '#fff' }}>{plotNo}</div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0 }}>Plot {plotNo}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{sqft.toLocaleString()} sqft</p>
            </div>
            <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: fc.bg, color: fc.color, border: `1px solid ${fc.border}` }}>{FACING[facing]} Facing</span>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '20px 24px 24px', overflowY: 'auto', maxHeight: '70vh' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Status</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {['available', 'booked', 'sold'].map(s => {
                const sc = STATUS_STYLE[s]
                const active = status === s
                return (
                  <button key={s} onClick={() => setStatus(s)} style={{ padding: '10px 8px', borderRadius: 10, border: `2px solid ${active ? sc.border : '#E2E8F0'}`, background: active ? sc.bg : '#F8FAFC', cursor: 'pointer', color: active ? sc.color : '#64748B', fontWeight: active ? 700 : 500, fontSize: 13 }}>
                    {sc.label}
                  </button>
                )
              })}
            </div>
          </div>

          {needsBuyer && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Buyer Name *</label>
                <input value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="Full name of buyer" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Sale Price (₹) *</label>
                  <input type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="e.g. 2100000" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>{status === 'booked' ? 'Advance Paid (₹)' : 'Final Amount (₹)'}</label>
                  <input type="number" value={advance} onChange={e => setAdvance(e.target.value)} placeholder={status === 'booked' ? 'Advance amount' : 'Same as sale price'} style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>{status === 'booked' ? 'Booking Date' : 'Sale Date'}</label>
                <input type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} style={inputStyle} />
              </div>
            </>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Notes / Log</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any remarks, payment schedule, conditions..." rows={3} style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #1B3A6B, #2A5298)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
              <Save size={15} /> {saving ? 'Saving...' : 'Save'}
            </button>
            {existing && existing.status !== 'available' && (
              <button onClick={onClear} style={{ padding: '12px 16px', borderRadius: 10, border: '1.5px solid #FCA5A5', background: '#FEF2F2', color: '#991B1B', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Trash2 size={14} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

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
              <tr key={row.plot_no} onClick={() => onPlotClick(row.plot_no, f, sqft, row)}
                style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1E293B' }}>{row.plot_no}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700, background: fc.bg, color: fc.color, border: `1px solid ${fc.border}` }}>{FACING[f] || f}</span>
                </td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{sqft?.toLocaleString()}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{sc.label}</span>
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

// ═══════════════════════════════════════════════════════
// RANAV ARYA — Unit Blocking Inventory
// ═══════════════════════════════════════════════════════

function AryaSummaryBar({ inventory }) {
  const blocked  = inventory.filter(u => u.status === 'blocked')
  const sold     = inventory.filter(u => u.status === 'sold')
  const available = ARYA_TOTAL_UNITS - blocked.length - sold.length

  // Block type breakdown
  const byType = {}
  BLOCK_TYPES.forEach(t => { byType[t] = blocked.filter(u => u.block_type === t).length })

  const cards = [
    { label: 'Total Units',  value: ARYA_TOTAL_UNITS, sub: '31 floors · 8 units/floor', color: '#1B3A6B', icon: Building2 },
    { label: 'Available',    value: available,         sub: `${Math.round(available / ARYA_TOTAL_UNITS * 100)}% open`, color: '#1A7A3A', icon: Home },
    { label: 'Blocked',      value: blocked.length,    sub: blocked.length ? `${byType['Presales'] || 0} presales · ${byType['EOI'] || 0} EOI` : 'None blocked', color: '#4338CA', icon: Lock },
    { label: 'Sold',         value: sold.length,       sub: sold.length ? 'Units confirmed' : 'No sales yet', color: '#AA2222', icon: CheckCircle2 },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
      {cards.map(({ label, value, sub, color, icon: Icon }) => (
        <div key={label} style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`, borderRadius: 16, padding: '18px 20px', position: 'relative', overflow: 'hidden', boxShadow: `0 6px 20px ${color}33` }}>
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

function AryaFloorGrid({ inventory, onUnitClick, filter }) {
  const byId = {}
  inventory.forEach(u => { byId[u.unit_id] = u })

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '48px repeat(8, 1fr)', gap: 4, marginBottom: 4, minWidth: 600 }}>
        <div />
        {ARYA_UNITS.map(u => {
          const fc = FACING_COLOR[u.facing]
          return (
            <div key={u.unit} style={{ textAlign: 'center', padding: '4px 2px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#1E293B' }}>U{String(u.unit).padStart(2,'0')}</div>
              <div style={{ fontSize: 9, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
              <span style={{ display: 'inline-block', fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 3, background: fc.bg, color: fc.color, border: `1px solid ${fc.border}` }}>{u.facing}</span>
              <div style={{ fontSize: 8, color: '#94A3B8', marginTop: 2 }}>{u.sft.toLocaleString()} sft</div>
            </div>
          )
        })}
      </div>

      {/* Floor rows */}
      {ARYA_FLOORS.map(floor => (
        <div key={floor} style={{ display: 'grid', gridTemplateColumns: '48px repeat(8, 1fr)', gap: 4, marginBottom: 3, minWidth: 600 }}>
          {/* Floor label */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F1F5F9', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#475569' }}>
            {floor}
          </div>

          {ARYA_UNITS.map(unitDef => {
            const uid  = aryaUnitId(floor, unitDef.unit)
            const inv  = byId[uid]
            const status = inv?.status || 'available'
            const sc   = BLOCK_STYLE[status]

            // Filter logic
            if (filter !== 'all' && status !== filter) {
              return <div key={uid} style={{ borderRadius: 6, background: '#F8FAFC', border: '1px dashed #E2E8F0', minHeight: 38 }} />
            }

            const btc = inv?.block_type ? BLOCK_TYPE_COLOR[inv.block_type] : null

            return (
              <button key={uid} onClick={() => onUnitClick(floor, unitDef, inv)}
                title={`Floor ${floor} · ${unitDef.name} · ${unitDef.config} · ${unitDef.sft.toLocaleString()} sft${inv?.blocked_by ? ' · ' + inv.blocked_by : ''}`}
                style={{
                  background: status === 'available' ? '#fff' : (btc?.bg || sc.bg),
                  border: `1.5px solid ${status === 'available' ? '#E2E8F0' : (btc?.border || sc.border)}`,
                  borderRadius: 6, padding: '4px 2px', cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.12s', minHeight: 38,
                  boxShadow: status !== 'available' ? `0 1px 6px ${sc.border}55` : 'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.12)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = status !== 'available' ? `0 1px 6px ${sc.border}55` : 'none' }}
              >
                {status === 'available' ? (
                  <span style={{ fontSize: 9, color: '#CBD5E1' }}>–</span>
                ) : (
                  <>
                    <span style={{ display: 'block', fontSize: 8, fontWeight: 700, color: btc?.color || sc.color, textTransform: 'uppercase', letterSpacing: '0.2px' }}>
                      {status === 'blocked' ? (inv.block_type?.split(' ')[0] || 'Block') : 'Sold'}
                    </span>
                    {inv?.blocked_by && (
                      <span style={{ display: 'block', fontSize: 7, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                        {inv.blocked_by}
                      </span>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function AryaUnitModal({ floor, unitDef, existing, onClose, onSave, onClear, saving }) {
  const [status, setStatus]       = useState(existing?.status || 'available')
  const [blockType, setBlockType] = useState(existing?.block_type || BLOCK_TYPES[0])
  const [blockedBy, setBlockedBy] = useState(existing?.blocked_by || '')
  const [phone, setPhone]         = useState(existing?.phone || '')
  const [blockedAt, setBlockedAt] = useState(existing?.blocked_at || new Date().toISOString().slice(0, 10))
  const [notes, setNotes]         = useState(existing?.notes || '')

  const fc       = FACING_COLOR[unitDef.facing]
  const needsInfo = status === 'blocked' || status === 'sold'

  function handleSave() {
    if (needsInfo && !blockedBy.trim()) { toast.error('Please enter the person name'); return }
    onSave({
      status,
      block_type:  status === 'blocked' ? blockType : null,
      blocked_by:  blockedBy.trim() || null,
      phone:       phone.trim() || null,
      blocked_at:  blockedAt || null,
      notes:       notes.trim() || null,
    })
  }

  const headerBg = status === 'sold'
    ? 'linear-gradient(135deg, #AA2222, #7F1D1D)'
    : status === 'blocked'
    ? 'linear-gradient(135deg, #3730A3, #1E1B4B)'
    : 'linear-gradient(135deg, #1B3A6B, #0F2347)'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 24px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: headerBg, padding: '20px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '6px 14px', fontSize: 16, fontWeight: 800, color: '#fff' }}>
                Floor {floor} · U{String(unitDef.unit).padStart(2,'0')}
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: fc.bg, color: fc.color, border: `1px solid ${fc.border}` }}>
                {FACING[unitDef.facing]} Facing
              </span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '8px 0 2px' }}>{unitDef.name} · {unitDef.config}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{unitDef.sft.toLocaleString()} sft carpet</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '20px 24px 24px', overflowY: 'auto', maxHeight: '70vh' }}>

          {/* Status */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Status</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {['available', 'blocked', 'sold'].map(s => {
                const sc = BLOCK_STYLE[s]
                const active = status === s
                return (
                  <button key={s} onClick={() => setStatus(s)} style={{ padding: '10px 8px', borderRadius: 10, border: `2px solid ${active ? sc.border : '#E2E8F0'}`, background: active ? sc.bg : '#F8FAFC', cursor: 'pointer', color: active ? sc.color : '#64748B', fontWeight: active ? 700 : 500, fontSize: 13 }}>
                    {sc.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Block type — only when Blocked */}
          {status === 'blocked' && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Block Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {BLOCK_TYPES.map(bt => {
                  const btc = BLOCK_TYPE_COLOR[bt]
                  const active = blockType === bt
                  return (
                    <button key={bt} onClick={() => setBlockType(bt)} style={{ padding: '8px 10px', borderRadius: 8, border: `2px solid ${active ? btc.border : '#E2E8F0'}`, background: active ? btc.bg : '#F8FAFC', cursor: 'pointer', color: active ? btc.color : '#64748B', fontWeight: active ? 700 : 500, fontSize: 12, textAlign: 'left' }}>
                      {bt}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {needsInfo && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>{status === 'sold' ? 'Buyer Name *' : 'Blocked By *'}</label>
                <input value={blockedBy} onChange={e => setBlockedBy(e.target.value)}
                  placeholder={status === 'sold' ? 'Full name of buyer' : 'Agent / Customer name'}
                  style={inputStyle} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  style={inputStyle} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>{status === 'sold' ? 'Sale Date' : 'Block Date'}</label>
                <input type="date" value={blockedAt} onChange={e => setBlockedAt(e.target.value)} style={inputStyle} />
              </div>
            </>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Pricing, conditions, follow-up date..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #1B3A6B, #2A5298)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
              <Save size={15} /> {saving ? 'Saving...' : 'Save'}
            </button>
            {existing && existing.status !== 'available' && (
              <button onClick={onClear} style={{ padding: '12px 16px', borderRadius: 10, border: '1.5px solid #FCA5A5', background: '#FEF2F2', color: '#991B1B', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Trash2 size={14} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AryaBlockList({ inventory, onUnitClick }) {
  const active = inventory
    .filter(u => u.status === 'blocked' || u.status === 'sold')
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'sold' ? -1 : 1
      return new Date(b.updated_at || 0) - new Date(a.updated_at || 0)
    })

  if (!active.length) return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
      <Lock size={40} strokeWidth={1} style={{ margin: '0 auto 12px' }} />
      <p style={{ fontSize: 14 }}>No blocked or sold units yet</p>
    </div>
  )

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#F1F5F9' }}>
            {['Unit', 'Floor', 'Type', 'Config', 'Sft', 'Status', 'Block Type', 'Name', 'Phone', 'Date', 'Notes'].map(h => (
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {active.map(row => {
            const [floorStr, unitStr] = row.unit_id.split('-')
            const floor   = parseInt(floorStr)
            const unitNo  = parseInt(unitStr)
            const unitDef = ARYA_UNITS.find(u => u.unit === unitNo)
            const sc  = BLOCK_STYLE[row.status]
            const btc = row.block_type ? BLOCK_TYPE_COLOR[row.block_type] : null
            return (
              <tr key={row.unit_id}
                onClick={() => onUnitClick(floor, unitDef, row)}
                style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1E293B' }}>F{floorStr}-U{unitStr}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{floor}</td>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1E293B' }}>{unitDef?.name || '—'}</td>
                <td style={{ padding: '12px 14px', color: '#64748B' }}>{unitDef?.config || '—'}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{unitDef?.sft?.toLocaleString()}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{sc.label}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {btc ? (
                    <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700, background: btc.bg, color: btc.color, border: `1px solid ${btc.border}` }}>{row.block_type}</span>
                  ) : '—'}
                </td>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1E293B' }}>{row.blocked_by || '—'}</td>
                <td style={{ padding: '12px 14px', color: '#64748B' }}>{row.phone || '—'}</td>
                <td style={{ padding: '12px 14px', color: '#64748B', whiteSpace: 'nowrap' }}>{row.blocked_at ? new Date(row.blocked_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                <td style={{ padding: '12px 14px', color: '#64748B', maxWidth: 180 }}>
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

// ═══════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// ARYA IMPORT MODAL
// ═══════════════════════════════════════════════════════

const COL_MAP = {
  floor: ['floor', 'flr', 'floor_no', 'floorno'],
  unit_no: ['unit_no', 'unit', 'unitno', 'unit_number', 'unitnumber', 'unit_pos', 'position'],
  status: ['status', 'state'],
  block_type: ['block_type', 'blocktype', 'block type', 'type', 'block_category'],
  blocked_by: ['blocked_by', 'blockedby', 'name', 'customer', 'client', 'buyer', 'person', 'contact_name'],
  phone: ['phone', 'mobile', 'contact', 'phone_no', 'mobileno', 'number'],
  notes: ['notes', 'note', 'remarks', 'comment', 'comments'],
  blocked_at: ['blocked_at', 'blockedat', 'date', 'block_date', 'blockdate', 'booking_date'],
}

function normalizeHeader(h) {
  return String(h).toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

function normalizeStatus(v) {
  const s = String(v).toLowerCase().trim()
  if (s === 'blocked' || s === 'block') return 'blocked'
  if (s === 'sold') return 'sold'
  return 'available'
}

function normalizeBlockType(v) {
  if (!v) return null
  const s = String(v).trim()
  const match = BLOCK_TYPES.find(bt => bt.toLowerCase() === s.toLowerCase())
  return match || s
}

function normalizeDate(v) {
  if (!v) return null
  if (typeof v === 'number') {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(v)
    if (d) return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`
  }
  const s = String(v).trim()
  if (!s) return null
  const d = new Date(s)
  if (!isNaN(d)) return d.toISOString().slice(0, 10)
  return null
}

function parseSheet(rows) {
  if (!rows.length) return { parsed: [], errors: [] }
  const headers = Object.keys(rows[0]).map(normalizeHeader)
  const rawHeaders = Object.keys(rows[0])

  // Build field→colIndex map
  const fieldIdx = {}
  Object.entries(COL_MAP).forEach(([field, aliases]) => {
    const idx = headers.findIndex(h => aliases.includes(h))
    if (idx !== -1) fieldIdx[field] = rawHeaders[idx]
  })

  const parsed = []
  const errors = []

  rows.forEach((row, i) => {
    const get = field => fieldIdx[field] != null ? row[fieldIdx[field]] : undefined
    const floor = parseInt(get('floor'))
    const unitNo = parseInt(String(get('unit_no') || '').replace(/[^0-9]/g, ''))

    if (!floor || floor < 2 || floor > 32) {
      errors.push(`Row ${i + 2}: invalid floor "${get('floor')}"`)
      return
    }
    if (!unitNo || unitNo < 1 || unitNo > 8) {
      errors.push(`Row ${i + 2}: invalid unit_no "${get('unit_no')}"`)
      return
    }

    const status = normalizeStatus(get('status') || 'blocked')
    parsed.push({
      unit_id:    aryaUnitId(floor, unitNo),
      floor,
      unit_no:    unitNo,
      unit_type:  ARYA_UNITS.find(u => u.unit === unitNo)?.name || null,
      status,
      block_type: status === 'blocked' ? normalizeBlockType(get('block_type')) : null,
      blocked_by: get('blocked_by') ? String(get('blocked_by')).trim() : null,
      phone:      get('phone') ? String(get('phone')).trim() : null,
      notes:      get('notes') ? String(get('notes')).trim() : null,
      blocked_at: normalizeDate(get('blocked_at')),
    })
  })

  return { parsed, errors }
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['floor', 'unit_no', 'status', 'block_type', 'blocked_by', 'phone', 'notes', 'blocked_at'],
    [32, 1, 'blocked', 'Presales', 'Rahul Sharma', '9876543210', 'Follow up next week', '2026-06-15'],
    [31, 3, 'blocked', 'EOI', 'Priya Mehta', '9123456789', '', '2026-06-20'],
    [30, 7, 'sold', '', 'Arun Kumar', '9900112233', 'Deal closed', '2026-05-10'],
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'ARYA Inventory')
  XLSX.writeFile(wb, 'arya_inventory_template.xlsx')
}

function AryaImportModal({ onClose, onImportDone }) {
  const fileRef = useRef()
  const [rows, setRows]         = useState(null)
  const [errors, setErrors]     = useState([])
  const [importing, setImporting] = useState(false)
  const [drag, setDrag]         = useState(false)

  function processFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array', cellDates: false })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' })
        const { parsed, errors } = parseSheet(data)
        setRows(parsed)
        setErrors(errors)
      } catch (err) {
        toast.error('Could not read file: ' + err.message)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  function onFileChange(e) { processFile(e.target.files[0]) }
  function onDrop(e) {
    e.preventDefault(); setDrag(false)
    processFile(e.dataTransfer.files[0])
  }

  async function handleImport() {
    if (!rows?.length) return
    setImporting(true)
    try {
      const { error } = await insforge.database.from('arya_inventory').upsert(rows, { onConflict: 'unit_id' })
      if (error) throw error
      toast.success(`${rows.length} units imported successfully`)
      onImportDone()
      onClose()
    } catch (e) {
      toast.error('Import failed: ' + (e.message || 'Unknown error'))
    } finally {
      setImporting(false)
    }
  }

  const blocked = rows?.filter(r => r.status === 'blocked').length || 0
  const sold    = rows?.filter(r => r.status === 'sold').length || 0

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1B3A6B, #0F2347)', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Import ARYA Inventory</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: '2px 0 0' }}>Upload Excel (.xlsx) or CSV — supports bulk blocked/sold data</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={downloadTemplate} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <Download size={13} /> Template
            </button>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>

          {/* Drop zone */}
          {!rows && (
            <div
              onDragOver={e => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${drag ? '#1B3A6B' : '#CBD5E1'}`, borderRadius: 14, padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: drag ? '#EFF6FF' : '#F8FAFC', transition: 'all 0.15s' }}>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={onFileChange} style={{ display: 'none' }} />
              <Upload size={36} color={drag ? '#1B3A6B' : '#94A3B8'} strokeWidth={1.5} style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: drag ? '#1B3A6B' : '#475569', margin: '0 0 4px' }}>Drop your Excel or CSV file here</p>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>or click to browse · .xlsx · .xls · .csv</p>
              <p style={{ fontSize: 11, color: '#CBD5E1', margin: '12px 0 0' }}>Required columns: floor, unit_no · Optional: status, block_type, blocked_by, phone, notes, blocked_at</p>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '12px 14px', marginBottom: 16, marginTop: rows ? 0 : 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <AlertCircle size={14} color="#DC2626" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626' }}>{errors.length} row{errors.length > 1 ? 's' : ''} skipped</span>
              </div>
              {errors.map((e, i) => <p key={i} style={{ fontSize: 11, color: '#991B1B', margin: '2px 0' }}>{e}</p>)}
            </div>
          )}

          {/* Preview */}
          {rows && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{rows.length} units ready to import</span>
                  {blocked > 0 && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, background: '#EEF2FF', color: '#3730A3', fontWeight: 600 }}>{blocked} blocked</span>}
                  {sold > 0 && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, background: '#FEF2F2', color: '#991B1B', fontWeight: 600 }}>{sold} sold</span>}
                </div>
                <button onClick={() => { setRows(null); setErrors([]) }} style={{ fontSize: 12, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  Change file
                </button>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 10, marginBottom: 20 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      {['Unit ID', 'Floor', 'Unit', 'Type', 'Status', 'Block Type', 'Name', 'Phone', 'Date'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', borderBottom: '1px solid #E2E8F0' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const sc = BLOCK_STYLE[r.status]
                      const btc = r.block_type ? BLOCK_TYPE_COLOR[r.block_type] : null
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1E293B' }}>{r.unit_id}</td>
                          <td style={{ padding: '8px 12px', color: '#475569' }}>{r.floor}</td>
                          <td style={{ padding: '8px 12px', color: '#475569' }}>{r.unit_no}</td>
                          <td style={{ padding: '8px 12px', color: '#64748B' }}>{r.unit_type || '—'}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{sc.label}</span>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            {btc ? <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, background: btc.bg, color: btc.color, border: `1px solid ${btc.border}` }}>{r.block_type}</span> : '—'}
                          </td>
                          <td style={{ padding: '8px 12px', color: '#1E293B' }}>{r.blocked_by || '—'}</td>
                          <td style={{ padding: '8px 12px', color: '#64748B' }}>{r.phone || '—'}</td>
                          <td style={{ padding: '8px 12px', color: '#64748B', whiteSpace: 'nowrap' }}>{r.blocked_at || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <button onClick={handleImport} disabled={importing || !rows.length} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #1B3A6B, #2A5298)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: importing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: importing ? 0.7 : 1 }}>
                <Upload size={15} /> {importing ? 'Importing...' : `Import ${rows.length} Units`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const PROJECTS = [
  { key: 'anvaya', label: 'Anvaya Grove', sub: '282 Plots · Budigere Cross' },
  { key: 'arya',   label: 'Ranav ARYA',   sub: '248 Units · G+32 · Budigere Cross' },
]

export default function Inventory() {
  const { profile } = useAuthContext()

  const [activeProject, setActiveProject] = useState('anvaya')
  const [dropdownOpen, setDropdownOpen]   = useState(false)

  // Anvaya state
  const [inventory, setInventory]   = useState([])
  const [loadingA, setLoadingA]     = useState(true)
  const [modalA, setModalA]         = useState(null)
  const [filterA, setFilterA]       = useState('all')

  // ARYA state
  const [aryaInventory, setAryaInventory] = useState([])
  const [loadingB, setLoadingB]           = useState(false)
  const [aryaLoaded, setAryaLoaded]       = useState(false)
  const [modalB, setModalB]               = useState(null)
  const [filterB, setFilterB]             = useState('all')

  const [saving, setSaving]       = useState(false)
  const [showImport, setShowImport] = useState(false)

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

  // ── Anvaya fetch ──────────────────────────────────────
  const fetchInventory = useCallback(async () => {
    setLoadingA(true)
    try {
      const { data, error } = await insforge.database.from('plot_inventory').select('*').neq('status', 'available')
      if (error) throw error
      setInventory(data || [])
    } catch (e) {
      toast.error('Failed to load Anvaya inventory')
    } finally {
      setLoadingA(false)
    }
  }, [])

  useEffect(() => { fetchInventory() }, [fetchInventory])

  // ── ARYA fetch (lazy — only when tab opened) ──────────
  const fetchAryaInventory = useCallback(async () => {
    setLoadingB(true)
    try {
      const { data, error } = await insforge.database.from('arya_inventory').select('*').neq('status', 'available')
      if (error) throw error
      setAryaInventory(data || [])
      setAryaLoaded(true)
    } catch (e) {
      toast.error('Failed to load ARYA inventory')
    } finally {
      setLoadingB(false)
    }
  }, [])

  useEffect(() => {
    if (activeProject === 'arya' && !aryaLoaded) fetchAryaInventory()
  }, [activeProject, aryaLoaded, fetchAryaInventory])

  // ── Anvaya handlers ───────────────────────────────────
  async function handleSaveA(formData) {
    if (!modalA) return
    setSaving(true)
    try {
      const { error } = await insforge.database.from('plot_inventory').upsert({ plot_no: modalA.plotNo, ...formData, updated_by: profile.id }, { onConflict: 'plot_no' })
      if (error) throw error
      toast.success(`Plot ${modalA.plotNo} updated`)
      setModalA(null)
      await fetchInventory()
    } catch (e) {
      toast.error('Failed to save: ' + (e.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  async function handleClearA() {
    if (!modalA || !confirm(`Mark Plot ${modalA.plotNo} as available?`)) return
    setSaving(true)
    try {
      const { error } = await insforge.database.from('plot_inventory').delete().eq('plot_no', modalA.plotNo)
      if (error) throw error
      toast.success(`Plot ${modalA.plotNo} cleared`)
      setModalA(null)
      await fetchInventory()
    } catch (e) {
      toast.error('Failed to clear')
    } finally {
      setSaving(false)
    }
  }

  // ── ARYA handlers ─────────────────────────────────────
  async function handleSaveB(formData) {
    if (!modalB) return
    setSaving(true)
    try {
      const uid = aryaUnitId(modalB.floor, modalB.unitDef.unit)
      const payload = {
        unit_id:   uid,
        floor:     modalB.floor,
        unit_no:   modalB.unitDef.unit,
        unit_type: modalB.unitDef.name,
        ...formData,
        updated_by: profile.id,
      }
      const { error } = await insforge.database.from('arya_inventory').upsert(payload, { onConflict: 'unit_id' })
      if (error) throw error
      toast.success(`Floor ${modalB.floor} · ${modalB.unitDef.name} updated`)
      setModalB(null)
      await fetchAryaInventory()
    } catch (e) {
      toast.error('Failed to save: ' + (e.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  async function handleClearB() {
    if (!modalB) return
    const uid = aryaUnitId(modalB.floor, modalB.unitDef.unit)
    if (!confirm(`Mark Floor ${modalB.floor} · ${modalB.unitDef.name} as available?`)) return
    setSaving(true)
    try {
      const { error } = await insforge.database.from('arya_inventory').delete().eq('unit_id', uid)
      if (error) throw error
      toast.success('Unit cleared')
      setModalB(null)
      await fetchAryaInventory()
    } catch (e) {
      toast.error('Failed to clear')
    } finally {
      setSaving(false)
    }
  }

  // ── Anvaya filter buttons ─────────────────────────────
  const filterBtnsA = [
    { key: 'all',       label: 'All Plots', count: 282 },
    { key: 'available', label: 'Available', count: 282 - inventory.length },
    { key: 'booked',    label: 'Booked',    count: inventory.filter(p => p.status === 'booked').length },
    { key: 'sold',      label: 'Sold',      count: inventory.filter(p => p.status === 'sold').length },
  ]

  // ── ARYA filter buttons ───────────────────────────────
  const filterBtnsB = [
    { key: 'all',       label: 'All Units', count: ARYA_TOTAL_UNITS },
    { key: 'available', label: 'Available', count: ARYA_TOTAL_UNITS - aryaInventory.length },
    { key: 'blocked',   label: 'Blocked',   count: aryaInventory.filter(u => u.status === 'blocked').length },
    { key: 'sold',      label: 'Sold',      count: aryaInventory.filter(u => u.status === 'sold').length },
  ]

  const activeProjectMeta = PROJECTS.find(p => p.key === activeProject)

  return (
    <Layout>
      <div style={{ padding: '24px 24px 60px', maxWidth: 1200, margin: '0 auto' }}>

        {/* ── Page Title + Project Selector ── */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>
              {activeProject === 'anvaya' ? 'Plot Inventory' : 'Ranav ARYA Inventory'}
            </h1>
            <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
              {activeProjectMeta.sub} · {activeProject === 'anvaya' ? 'Click any plot to mark sold / booked' : 'Click any unit to block / mark sold'}
            </p>
          </div>

          {/* Project dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#1E293B', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minWidth: 200 }}>
              <Building2 size={16} color="#1B3A6B" />
              <span style={{ flex: 1, textAlign: 'left' }}>{activeProjectMeta.label}</span>
              <ChevronDown size={14} color="#94A3B8" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>

            {dropdownOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, background: '#fff', borderRadius: 12, border: '1.5px solid #E2E8F0', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 240, overflow: 'hidden' }}>
                {PROJECTS.map(proj => (
                  <button key={proj.key}
                    onClick={() => { setActiveProject(proj.key); setDropdownOpen(false) }}
                    style={{ width: '100%', padding: '12px 16px', border: 'none', background: activeProject === proj.key ? '#F0F4FF' : '#fff', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: activeProject === proj.key ? '#1B3A6B' : '#1E293B' }}>{proj.label}</span>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{proj.sub}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── ANVAYA GROVE ── */}
        {activeProject === 'anvaya' && (
          <>
            <SummaryBar inventory={inventory} />

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', marginBottom: 24, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0 }}>Plot Map</h2>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {filterBtnsA.map(({ key, label, count }) => (
                    <button key={key} onClick={() => setFilterA(key)} style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${filterA === key ? '#1B3A6B' : '#E2E8F0'}`, background: filterA === key ? '#1B3A6B' : '#fff', color: filterA === key ? '#fff' : '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {label} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: '10px 20px 6px', display: 'flex', gap: 16, flexWrap: 'wrap', borderBottom: '1px solid #F8FAFC' }}>
                {[{ label: 'Available', color: '#E2E8F0' }, { label: 'Booked', color: '#FDE047' }, { label: 'Sold', color: '#FCA5A5' }, { label: 'E = East', color: '#86EFAC' }, { label: 'W = West', color: '#FDE047' }, { label: 'S = South', color: '#FCA5A5' }].map(({ label, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                    <span style={{ fontSize: 11, color: '#64748B' }}>{label}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '16px 20px 20px' }}>
                {loadingA ? <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>Loading...</div>
                  : <PlotGrid inventory={inventory} onPlotClick={(n, f, s, inv) => setModalA({ plotNo: n, facing: f, sqft: s, existing: inv || null })} filter={filterA} />}
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0 }}>Sold & Booked — {inventory.filter(p => p.status !== 'available').length} plots</h2>
              </div>
              <SalesList inventory={inventory} onPlotClick={(n, f, s, inv) => setModalA({ plotNo: n, facing: f, sqft: s, existing: inv || null })} />
            </div>
          </>
        )}

        {/* ── RANAV ARYA ── */}
        {activeProject === 'arya' && (
          <>
            <AryaSummaryBar inventory={aryaInventory} />

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', marginBottom: 24, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0 }}>Floor Map · G+32</h2>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>Floors 2–32 · 8 units per floor · Ground & 1st = Amenities</p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {filterBtnsB.map(({ key, label, count }) => (
                    <button key={key} onClick={() => setFilterB(key)} style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${filterB === key ? '#1B3A6B' : '#E2E8F0'}`, background: filterB === key ? '#1B3A6B' : '#fff', color: filterB === key ? '#fff' : '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {label} {count >= 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
                    </button>
                  ))}
                  <button onClick={() => setShowImport(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, border: '1.5px solid #C7D7FE', background: '#EEF2FF', color: '#3730A3', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <Upload size={12} /> Import Excel
                  </button>
                </div>
              </div>

              {/* ARYA Legend */}
              <div style={{ padding: '10px 20px 6px', display: 'flex', gap: 16, flexWrap: 'wrap', borderBottom: '1px solid #F8FAFC' }}>
                {[{ label: 'Available', color: '#E2E8F0' }, { label: 'Presales', color: 'rgba(139,92,246,0.4)' }, { label: 'EOI', color: 'rgba(249,115,22,0.4)' }, { label: 'Agent Block', color: 'rgba(59,130,246,0.4)' }, { label: 'Management Hold', color: 'rgba(71,85,105,0.4)' }, { label: 'Sold', color: '#FCA5A5' }].map(({ label, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                    <span style={{ fontSize: 11, color: '#64748B' }}>{label}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '16px 20px 20px' }}>
                {loadingB ? <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>Loading...</div>
                  : <AryaFloorGrid inventory={aryaInventory} onUnitClick={(floor, unitDef, inv) => setModalB({ floor, unitDef, existing: inv || null })} filter={filterB} />}
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0 }}>
                  Blocked & Sold — {aryaInventory.filter(u => u.status !== 'available').length} units
                </h2>
              </div>
              <AryaBlockList
                inventory={aryaInventory}
                onUnitClick={(floor, unitDef, inv) => setModalB({ floor, unitDef, existing: inv || null })}
              />
            </div>
          </>
        )}
      </div>

      {/* Anvaya Modal */}
      {modalA && (
        <PlotModal
          plotNo={modalA.plotNo} facing={modalA.facing} sqft={modalA.sqft} existing={modalA.existing}
          onClose={() => setModalA(null)} onSave={handleSaveA} onClear={handleClearA} saving={saving}
        />
      )}

      {/* ARYA Modal */}
      {modalB && (
        <AryaUnitModal
          floor={modalB.floor} unitDef={modalB.unitDef} existing={modalB.existing}
          onClose={() => setModalB(null)} onSave={handleSaveB} onClear={handleClearB} saving={saving}
        />
      )}

      {/* ARYA Import Modal */}
      {showImport && (
        <AryaImportModal
          onClose={() => setShowImport(false)}
          onImportDone={() => { setAryaLoaded(false); fetchAryaInventory() }}
        />
      )}
    </Layout>
  )
}
