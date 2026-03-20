import { useState } from 'react'
import { format } from 'date-fns'
import { MessageSquare, ArrowRight, Plus, UserCircle } from 'lucide-react'

function timelineIcon(type, actionType) {
  if (type === 'note') return <MessageSquare size={14} className="text-blue-500" />
  if (actionType === 'create') return <Plus size={14} className="text-green-500" />
  return <ArrowRight size={14} className="text-gray-400" />
}

function activityLabel(entry) {
  if (!entry.new_value) return 'Lead updated'
  try {
    const val = JSON.parse(entry.new_value)
    if (val.pipeline_stage) return `Stage changed to "${val.pipeline_stage.replace(/_/g, ' ')}"`
    if (val.follow_up_at)   return `Follow-up set to ${format(new Date(val.follow_up_at), 'dd MMM yyyy, h:mm a')}`
    if (val.lost_reason)    return `Lost reason: ${val.lost_reason}`
    if (entry.action_type === 'create') return entry.new_value
    const keys = Object.keys(val).filter(k => k !== 'updated_at')
    return keys.length ? `Updated: ${keys.join(', ')}` : 'Lead updated'
  } catch {
    return entry.new_value
  }
}

export default function LeadDetail({ entries, onAddNote, savingNote }) {
  const [note, setNote] = useState('')

  const handleSubmit = async () => {
    if (!note.trim()) return
    await onAddNote(note.trim())
    setNote('')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Activity Timeline</h3>

        {entries.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No activity yet.</p>
        ) : (
          <ol className="relative border-l border-gray-200 ml-2 space-y-4">
            {entries.map((entry, i) => (
              <li key={i} className="ml-5">
                {/* Dot */}
                <span className="absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full bg-white border border-gray-200">
                  {timelineIcon(entry.type, entry.action_type)}
                </span>

                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  {entry.type === 'note' ? (
                    <p className="text-sm text-gray-800">{entry.note}</p>
                  ) : (
                    <p className="text-sm text-gray-700">{activityLabel(entry)}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    <UserCircle size={11} className="text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {entry.agent_name || 'System'} · {format(new Date(entry.created_at), 'dd MMM, h:mm a')}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Add Note */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Add Note</h3>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          placeholder="Write a note about this lead…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
        />
        <button
          onClick={handleSubmit}
          disabled={!note.trim() || savingNote}
          className="mt-2 w-full py-2 bg-brand-blue text-white rounded-lg text-sm font-medium disabled:opacity-40"
        >
          {savingNote ? 'Saving…' : 'Save Note'}
        </button>
      </div>
    </div>
  )
}
