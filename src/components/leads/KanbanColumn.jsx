import { useDroppable, useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { format, isPast } from 'date-fns'
import { Plus, Phone, MessageCircle, Pencil } from 'lucide-react'
import { LEAD_SOURCES, TAG_STYLES } from '../../constants/leadSources'

function KanbanCard({ lead, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: lead,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.25 : 1,
  }

  const source    = LEAD_SOURCES.find(s => s.id === lead.source)
  const isOverdue = lead.follow_up_at && isPast(new Date(lead.follow_up_at))
  const waNumber  = lead.mobile.replace(/\D/g, '')

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 select-none"
    >
      {/* Drag handle + name */}
      <div className="flex items-start gap-2">
        <div
          {...listeners}
          className="mt-0.5 text-gray-300 hover:text-gray-400 cursor-grab active:cursor-grabbing shrink-0 text-base leading-none"
          title="Drag to move"
        >
          ⠿
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-gray-900 truncate">{lead.full_name}</p>
          <p className="text-xs text-gray-500">{lead.mobile}</p>
        </div>
      </div>

      {/* Source + Agent */}
      <div className="mt-2 flex flex-wrap gap-1">
        {source && (
          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
            {source.label}
          </span>
        )}
        {lead.assigned_agent?.full_name && (
          <span className="bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full text-xs font-medium">
            {lead.assigned_agent.full_name}
          </span>
        )}
      </div>

      {/* Highlighted tags only */}
      {lead.tags?.some(t => TAG_STYLES[t]) && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {lead.tags.filter(t => TAG_STYLES[t]).map(tag => (
            <span key={tag} className={`px-2 py-0.5 rounded-full text-xs font-medium ${TAG_STYLES[tag]}`}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Follow-up */}
      {lead.follow_up_at && (
        <p className={`mt-1.5 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
          {isOverdue ? '⚠ ' : ''}{format(new Date(lead.follow_up_at), 'dd MMM, h:mm a')}
        </p>
      )}

      {/* Actions */}
      <div className="mt-2.5 flex gap-1.5">
        <a
          href={`tel:${lead.mobile}`}
          className="flex-1 flex items-center justify-center gap-0.5 py-1.5 bg-green-50 text-green-700 rounded text-xs font-medium"
        >
          <Phone size={11} /> Call
        </a>
        <a
          href={`https://wa.me/${waNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-0.5 py-1.5 bg-emerald-50 text-emerald-700 rounded text-xs font-medium"
        >
          <MessageCircle size={11} /> WA
        </a>
        <button
          onClick={() => onEdit(lead)}
          className="flex-1 flex items-center justify-center gap-0.5 py-1.5 bg-blue-50 text-blue-700 rounded text-xs font-medium"
        >
          <Pencil size={11} /> Edit
        </button>
      </div>
    </div>
  )
}

export default function KanbanColumn({ stage, leads, onEdit, onAddLead }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  return (
    <div className="flex flex-col shrink-0 w-56">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded-t-xl"
        style={{ backgroundColor: stage.color }}
      >
        <span className="text-xs font-bold tracking-wide uppercase text-white">{stage.label}</span>
        <span className="bg-white/25 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
          {leads.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-64 rounded-b-xl flex flex-col gap-2 p-2 transition-colors ${
          isOver ? 'bg-brand-blue/10 ring-2 ring-inset ring-brand-blue/40' : 'bg-gray-100/80'
        }`}
      >
        {leads.map(lead => (
          <KanbanCard key={lead.id} lead={lead} onEdit={onEdit} />
        ))}

        {onAddLead && (
          <button
            onClick={onAddLead}
            className="mt-1 flex items-center justify-center gap-1 py-2 w-full rounded-lg border-2 border-dashed border-gray-300 text-gray-400 text-xs hover:border-brand-blue/40 hover:text-brand-blue transition-colors"
          >
            <Plus size={13} /> Add Lead
          </button>
        )}
      </div>
    </div>
  )
}
