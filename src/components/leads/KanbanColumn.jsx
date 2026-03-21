import { useDroppable, useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { format, isPast, isToday } from 'date-fns'
import { Plus, Phone, MessageCircle, Pencil, ExternalLink, GripVertical, CalendarClock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { LEAD_SOURCES, TAG_STYLES } from '../../constants/leadSources'

// Stages where the dot pulses — "action needed" stages only
const PING_STAGES = ['new_lead', 'contacted', 'site_visit_scheduled', 'negotiation']

// Unique accent color per stage for the dot + ping ring
const STAGE_DOT_COLOR = {
  new_lead:             '#FBBF24', // amber-gold  on gray header
  contacted:            '#67E8F9', // cyan        on blue header
  site_visit_scheduled: '#F9A8D4', // soft pink   on purple header
  site_visit_done:      '#FFFFFF', // white       on amber header (static)
  negotiation:          '#FDE68A', // yellow      on red header
  booking_done:         '#FFFFFF', // white       on green header (static)
  lost:                 '#FFFFFF', // white       on dark header (static)
}

// ── Glass design tokens ────────────────────────────────────────────────────
const glass = {
  card: {
    background:    'rgba(255, 255, 255, 0.78)',
    backdropFilter: 'blur(24px) saturate(200%)',
    WebkitBackdropFilter: 'blur(24px) saturate(200%)',
    border: '1px solid rgba(255, 255, 255, 0.82)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.07), 0 0.5px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.95)',
  },
  cardHover: {
    boxShadow: '0 10px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.95)',
  },
  column: {
    background:    'rgba(255, 255, 255, 0.38)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.65)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
  },
  columnHeader: {
    background:    'rgba(255, 255, 255, 0.58)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.65)',
  },
}

function KanbanCard({ lead, onEdit, stageColor }) {
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: lead,
  })

  const source     = LEAD_SOURCES.find(s => s.id === lead.source)
  const isOverdue  = lead.follow_up_at && isPast(new Date(lead.follow_up_at)) && !isToday(new Date(lead.follow_up_at))
  const isDueToday = lead.follow_up_at && isToday(new Date(lead.follow_up_at))
  const waNumber   = lead.mobile.replace(/\D/g, '')

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.15 : 1,
        borderLeft: `3px solid ${stageColor}`,
        borderRadius: '14px',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        touchAction: 'none',
        ...(isDragging ? { boxShadow: '0 16px 40px rgba(0,0,0,0.20)' } : glass.card),
      }}
      className="select-none group cursor-grab active:cursor-grabbing"
      onMouseEnter={e => {
        if (!isDragging) {
          e.currentTarget.style.boxShadow = glass.cardHover.boxShadow
          e.currentTarget.style.transform = `${CSS.Translate.toString(transform) || ''} translateY(-2px)`
        }
      }}
      onMouseLeave={e => {
        if (!isDragging) {
          e.currentTarget.style.boxShadow = glass.card.boxShadow
          e.currentTarget.style.transform = CSS.Translate.toString(transform) || ''
        }
      }}
    >
      {/* Grip indicator + name */}
      <div className="flex items-start gap-1.5 px-3 pt-3 pb-2">
        <div
          className="mt-0.5 shrink-0 transition-opacity"
          style={{ color: 'rgba(0,0,0,0.18)', opacity: 0.6 }}
        >
          <GripVertical size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="font-bold text-sm truncate cursor-pointer transition-colors"
            style={{ color: '#0F1E3C' }}
            onClick={() => navigate(`/leads/${lead.id}`)}
            onPointerDown={e => e.stopPropagation()}
            onMouseEnter={e => e.currentTarget.style.color = stageColor}
            onMouseLeave={e => e.currentTarget.style.color = '#0F1E3C'}
          >
            {lead.full_name}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(15,30,60,0.42)' }}>{lead.mobile}</p>
        </div>
      </div>

      {/* Badges */}
      <div className="px-3 pb-2 flex flex-wrap gap-1">
        {source && (
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{ backgroundColor: 'rgba(27,58,107,0.09)', color: '#1B3A6B' }}
          >
            {source.label}
          </span>
        )}
        {lead.assigned_agent?.full_name && (
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{ backgroundColor: 'rgba(201,146,42,0.12)', color: '#8A6010' }}
          >
            {lead.assigned_agent.full_name}
          </span>
        )}
      </div>

      {/* Highlighted tags */}
      {lead.tags?.some(t => TAG_STYLES[t]) && (
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {lead.tags.filter(t => TAG_STYLES[t]).map(tag => (
            <span key={tag} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${TAG_STYLES[tag]}`}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Follow-up */}
      {lead.follow_up_at && (
        <div
          className="mx-3 mb-2.5 flex items-center gap-1 text-[11px] font-semibold"
          style={{ color: isOverdue ? '#AA2222' : isDueToday ? '#C9922A' : 'rgba(15,30,60,0.38)' }}
        >
          <CalendarClock size={10} />
          {format(new Date(lead.follow_up_at), 'dd MMM, h:mm a')}
          {isOverdue && (
            <span className="ml-1 px-1.5 rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: '#AA2222' }}>
              OVERDUE
            </span>
          )}
          {isDueToday && (
            <span className="ml-1 px-1.5 rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: '#C9922A' }}>
              TODAY
            </span>
          )}
        </div>
      )}

      {/* Action row */}
      <div
        className="flex"
        style={{ borderTop: '1px solid rgba(255,255,255,0.55)' }}
        onPointerDown={e => e.stopPropagation()}
      >
        {[
          { href: `tel:${lead.mobile}`, label: 'Call',  icon: Phone,         color: '#1A7A3A', bg: 'rgba(26,122,58,0.07)'   },
          { href: `https://wa.me/${waNumber}`, label: 'WA', icon: MessageCircle, color: '#059669', bg: 'rgba(5,150,105,0.07)', external: true },
        ].map(({ href, label, icon: Icon, color, bg, external }, i) => (
          <>
            {i > 0 && <div key={`d${i}`} style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.55)' }} />}
            <a
              key={href}
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              className="flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-semibold transition-colors cursor-pointer"
              style={{ color }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = bg}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Icon size={10} /> {label}
            </a>
          </>
        ))}
        <div style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.55)' }} />
        <button
          onClick={() => onEdit(lead)}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-semibold transition-colors cursor-pointer"
          style={{ color: '#1B3A6B' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(27,58,107,0.07)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Pencil size={10} /> Edit
        </button>
        <div style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.55)' }} />
        <button
          onClick={() => navigate(`/leads/${lead.id}`)}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-semibold transition-colors cursor-pointer"
          style={{ color: 'rgba(15,30,60,0.38)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)'; e.currentTarget.style.color = 'rgba(15,30,60,0.65)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(15,30,60,0.38)' }}
        >
          <ExternalLink size={10} /> View
        </button>
      </div>
    </div>
  )
}

export default function KanbanColumn({ stage, leads, onEdit, onAddLead }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  return (
    <div
      className="flex flex-col shrink-0 w-60 rounded-2xl overflow-hidden"
      style={{
        boxShadow: isOver
          ? `0 12px 40px rgba(0,0,0,0.18), 0 0 0 2.5px ${stage.color}, 0 0 24px ${stage.color}40`
          : `0 4px 20px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px ${stage.color}15`,
        transition: 'box-shadow 0.2s ease',
      }}
    >
      {/* ── Coloured header — premium solid glass ────────── */}
      <div
        className="flex items-center justify-between px-4 py-3 relative overflow-hidden"
        style={{
          background: `
            linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 55%),
            linear-gradient(135deg, ${stage.color} 0%, ${stage.color}DD 60%, ${stage.color}BB 100%)
          `,
          boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.12)`,
          borderBottom: `1px solid ${stage.color}80`,
        }}
      >

        <div className="flex items-center gap-2 relative">
          {/* Ping dot — animated for active stages */}
          <div className="relative flex items-center justify-center w-3 h-3">
            {PING_STAGES.includes(stage.id) && (
              <span
                className="absolute inline-flex rounded-full animate-ping"
                style={{
                  width: 10, height: 10,
                  backgroundColor: STAGE_DOT_COLOR[stage.id] || '#ffffff',
                  opacity: 0.6,
                  animationDuration: '1.8s',
                }}
              />
            )}
            <div
              className="w-2 h-2 rounded-full relative"
              style={{
                backgroundColor: STAGE_DOT_COLOR[stage.id] || '#ffffff',
                boxShadow: `0 0 7px ${STAGE_DOT_COLOR[stage.id] || '#ffffff'}CC`,
              }}
            />
          </div>
          <span className="text-[11px] font-bold tracking-widest uppercase text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
            {stage.label}
          </span>
        </div>

        <span
          className="text-[10px] font-black tabular-nums px-2 py-0.5 rounded-full relative"
          style={{
            backgroundColor: 'rgba(255,255,255,0.22)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: '#ffffff',
            minWidth: '1.35rem',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.4)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
          }}
        >
          {leads.length}
        </span>
      </div>

      {/* ── Drop zone — ultra-light so blobs show through ── */}
      <div
        ref={setNodeRef}
        className="flex-1 min-h-64 flex flex-col gap-2 p-2 transition-colors duration-150"
        style={{
          background: isOver
            ? `${stage.color}18`
            : `linear-gradient(180deg, ${stage.color}0A 0%, rgba(255,255,255,0.06) 100%)`,
          borderTop: `1px solid rgba(255,255,255,0.35)`,
        }}
      >
        {leads.map(lead => (
          <KanbanCard key={lead.id} lead={lead} onEdit={onEdit} stageColor={stage.color} />
        ))}

        {onAddLead && (
          <button
            onClick={onAddLead}
            className="mt-1 flex items-center justify-center gap-1.5 py-2.5 w-full rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer"
            style={{
              border: `1.5px dashed ${stage.color}50`,
              color: `${stage.color}BB`,
              backgroundColor: 'transparent',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = stage.color
              e.currentTarget.style.color = stage.color
              e.currentTarget.style.backgroundColor = `${stage.color}10`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = `${stage.color}50`
              e.currentTarget.style.color = `${stage.color}BB`
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <Plus size={13} /> Add Lead
          </button>
        )}
      </div>
    </div>
  )
}
