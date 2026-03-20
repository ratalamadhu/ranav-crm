import { Phone, MessageCircle, Pencil } from 'lucide-react'
import { format, isPast } from 'date-fns'
import { STAGE_BY_ID } from '../../constants/pipelineStages'
import { LEAD_SOURCES } from '../../constants/leadSources'

export default function LeadCard({ lead, onEdit }) {
  const stage   = STAGE_BY_ID[lead.pipeline_stage] || {}
  const source  = LEAD_SOURCES.find(s => s.id === lead.source)
  const isOverdue = lead.follow_up_at && isPast(new Date(lead.follow_up_at))
  const waNumber  = lead.mobile.replace(/\D/g, '')
  const waMsg     = encodeURIComponent(`Hi ${lead.full_name}, this is from Ranav Group. `)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      {/* Name + Stage */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{lead.full_name}</p>
          <p className="text-sm text-gray-500">{lead.mobile}</p>
        </div>
        <span
          className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full text-white"
          style={{ backgroundColor: stage.color }}
        >
          {stage.label || lead.pipeline_stage}
        </span>
      </div>

      {/* Source + Agent badges */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {source && (
          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
            {source.label}
          </span>
        )}
        {lead.assigned_agent?.full_name && (
          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs">
            {lead.assigned_agent.full_name}
          </span>
        )}
        {lead.project?.name && (
          <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs">
            {lead.project.name}
          </span>
        )}
      </div>

      {/* Follow-up */}
      {lead.follow_up_at && (
        <p className={`mt-2 text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
          Follow-up: {format(new Date(lead.follow_up_at), 'dd MMM yyyy, h:mm a')}
          {isOverdue && ' — Overdue'}
        </p>
      )}

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <a
          href={`tel:${lead.mobile}`}
          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-green-50 text-green-700 text-xs font-medium"
        >
          <Phone size={13} /> Call
        </a>
        <a
          href={`https://wa.me/${waNumber}?text=${waMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium"
        >
          <MessageCircle size={13} /> WhatsApp
        </a>
        <button
          onClick={() => onEdit(lead)}
          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium"
        >
          <Pencil size={13} /> Edit
        </button>
      </div>
    </div>
  )
}
