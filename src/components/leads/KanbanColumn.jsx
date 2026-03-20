import { useDroppable, useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { format, isPast, isToday } from 'date-fns'
import { Plus, Phone, MessageCircle, Pencil, ExternalLink, GripVertical, CalendarClock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { LEAD_SOURCES, TAG_STYLES } from '../../constants/leadSources'

// ── Apple-style glass tokens ──────────────────────────────────────────────
const glass = {
  card: {
    background:    'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.65)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 0.5px 2px rgba(0,0,0,0.06)',
  },
  cardHover: {
    boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.07)',
  },
  column: {
    background:    'rgba(255, 255, 255, 0.30)',
    backdropFilter: 'blur(16px) saturate(160%)',
    WebkitBackdropFilter: 'blur(16px) saturate(160%)',
    border: '1px solid rgba(255, 255, 255, 0.55)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
  },
  columnHeader: {
    background:    'rgba(255, 255, 255, 0.52)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.55)',
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
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.15 : 1,
        borderLeft: `3px solid ${stageColor}`,
        borderRadius: '14px',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        ...(isDragging ? { boxShadow: '0 16px 40px rgba(0,0,0,0.20)' } : glass.card),
      }}
      {...attributes}
      className="select-none group"
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
      {/* Drag handle + name */}
      <div className="flex items-start gap-1.5 px-3 pt-3 pb-2">
        <div
          {...listeners}
          className="mt-0.5 cursor-grab active:cursor-grabbing shrink-0 transition-opacity"
          style={{ color: 'rgba(0,0,0,0.18)', opacity: 0.6 }}
          title="Drag to move"
        >
          <GripVertical size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="font-bold text-sm truncate cursor-pointer transition-colors"
            style={{ color: '#0F1E3C' }}
            onClick={() => navigate(`/leads/${lead.id}`)}
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
          ? `0 8px 28px rgba(0,0,0,0.14), 0 0 0 2px ${stage.color}80`
          : '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.15s ease',
      }}
    >
      {/* Solid coloured header — full stage identity */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          background: `linear-gradient(135deg, ${stage.color}F0 0%, ${stage.color}CC 100%)`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}
          />
          <span className="text-[11px] font-bold tracking-widest uppercase text-white">
            {stage.label}
          </span>
        </div>
        <span
          className="text-[10px] font-black tabular-nums px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: 'rgba(255,255,255,0.22)',
            color: '#ffffff',
            minWidth: '1.35rem',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        >
          {leads.length}
        </span>
      </div>

      {/* Glass drop zone — tinted with stage colour */}
      <div
        ref={setNodeRef}
        className="flex-1 min-h-64 flex flex-col gap-2 p-2 transition-colors duration-150"
        style={{
          background: isOver
            ? `${stage.color}18`
            : `linear-gradient(180deg, ${stage.color}0D 0%, rgba(241,245,249,0.85) 60%)`,
          backdropFilter: 'blur(16px) saturate(160%)',
          WebkitBackdropFilter: 'blur(16px) saturate(160%)',
          borderTop: `1px solid ${stage.color}30`,
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
