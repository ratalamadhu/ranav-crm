import { Phone, MessageCircle, Pencil, CalendarClock, ChevronRight } from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { STAGE_BY_ID } from '../../constants/pipelineStages'
import { LEAD_SOURCES, TAG_STYLES } from '../../constants/leadSources'

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function LeadCard({ lead, onEdit }) {
  const navigate   = useNavigate()
  const stage      = STAGE_BY_ID[lead.pipeline_stage] || {}
  const source     = LEAD_SOURCES.find(s => s.id === lead.source)
  const isOverdue  = lead.follow_up_at && isPast(new Date(lead.follow_up_at)) && !isToday(new Date(lead.follow_up_at))
  const isDueToday = lead.follow_up_at && isToday(new Date(lead.follow_up_at))
  const waNumber   = lead.mobile.replace(/\D/g, '')
  const waMsg      = encodeURIComponent(`Hi ${lead.full_name}, this is from Ranav Group. `)
  const stageColor = stage.color || '#1B3A6B'

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.72)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.07), 0 0.5px 2px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.11), 0 2px 6px rgba(0,0,0,0.06)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.07), 0 0.5px 2px rgba(0,0,0,0.05)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* ── Coloured stage header strip ────────────────── */}
      <div
        style={{
          background: `linear-gradient(135deg, ${stageColor}22 0%, ${stageColor}08 100%)`,
          borderBottom: `1px solid ${stageColor}20`,
          padding: '12px 14px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
        }}
        onClick={() => navigate(`/leads/${lead.id}`)}
      >
        {/* Avatar */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${stageColor}DD 0%, ${stageColor} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: `0 4px 12px ${stageColor}40`,
            border: '2px solid rgba(255,255,255,0.6)',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: '0.05em',
          }}
        >
          {getInitials(lead.full_name)}
        </div>

        {/* Name + mobile */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#0F1E3C', letterSpacing: '-0.01em', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {lead.full_name}
          </p>
          <p style={{ fontSize: 12, color: 'rgba(15,30,60,0.45)', marginTop: 2, fontWeight: 500 }}>
            {lead.mobile}
          </p>
        </div>

        {/* Stage badge + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: 99,
            backgroundColor: `${stageColor}18`,
            color: stageColor,
            letterSpacing: '0.04em',
            border: `1px solid ${stageColor}30`,
          }}>
            {stage.label || lead.pipeline_stage}
          </span>
          <ChevronRight size={14} style={{ color: 'rgba(15,30,60,0.25)' }} />
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────── */}
      <div style={{ padding: '10px 14px 12px' }}>

        {/* Badges row */}
        {(source || lead.assigned_agent?.full_name || lead.project?.name) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {source && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, backgroundColor: 'rgba(27,58,107,0.07)', color: '#1B3A6B' }}>
                {source.label}
              </span>
            )}
            {lead.assigned_agent?.full_name && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, backgroundColor: 'rgba(201,146,42,0.10)', color: '#8A6010' }}>
                {lead.assigned_agent.full_name}
              </span>
            )}
            {lead.project?.name && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, backgroundColor: 'rgba(26,122,58,0.08)', color: '#1A7A3A' }}>
                {lead.project.name}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {lead.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
            {lead.tags.map(tag => (
              <span key={tag} className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${TAG_STYLES[tag] || 'bg-gray-100 text-gray-500'}`}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Follow-up row */}
        {lead.follow_up_at && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              borderRadius: 10,
              backgroundColor: isOverdue ? 'rgba(170,34,34,0.07)' : isDueToday ? 'rgba(201,146,42,0.08)' : 'rgba(15,30,60,0.04)',
              border: `1px solid ${isOverdue ? 'rgba(170,34,34,0.18)' : isDueToday ? 'rgba(201,146,42,0.2)' : 'rgba(15,30,60,0.07)'}`,
            }}
          >
            <CalendarClock size={12} style={{ color: isOverdue ? '#AA2222' : isDueToday ? '#C9922A' : 'rgba(15,30,60,0.35)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: isOverdue ? '#AA2222' : isDueToday ? '#C9922A' : 'rgba(15,30,60,0.45)', flex: 1 }}>
              {format(new Date(lead.follow_up_at), 'dd MMM yyyy, h:mm a')}
            </span>
            {isOverdue && (
              <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 99, backgroundColor: '#AA2222', color: '#fff', letterSpacing: '0.06em' }}>
                OVERDUE
              </span>
            )}
            {isDueToday && (
              <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 99, backgroundColor: '#C9922A', color: '#fff', letterSpacing: '0.06em' }}>
                TODAY
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Action row ─────────────────────────────────── */}
      <div style={{ display: 'flex', borderTop: '1px solid rgba(15,30,60,0.06)' }}>
        {[
          { href: `tel:${lead.mobile}`,                           label: 'Call',      icon: Phone,         color: '#1A7A3A', bg: 'rgba(26,122,58,0.07)'   },
          { href: `https://wa.me/${waNumber}?text=${waMsg}`,      label: 'WhatsApp',  icon: MessageCircle, color: '#059669', bg: 'rgba(5,150,105,0.07)',  external: true },
        ].map(({ href, label, icon: Icon, color, bg, external }) => (
          <a
            key={label}
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '12px 0',
              fontSize: 12,
              fontWeight: 700,
              color,
              textDecoration: 'none',
              transition: 'background 0.15s',
              borderRight: '1px solid rgba(15,30,60,0.06)',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = bg}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Icon size={14} /> {label}
          </a>
        ))}
        <button
          onClick={() => onEdit(lead)}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '12px 0',
            fontSize: 12,
            fontWeight: 700,
            color: '#1B3A6B',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(27,58,107,0.07)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Pencil size={14} /> Edit
        </button>
      </div>
    </div>
  )
}
