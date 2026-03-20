import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import KanbanColumn from './KanbanColumn'
import { PIPELINE_STAGES } from '../../constants/pipelineStages'
import { LOST_REASONS } from '../../constants/leadSources'

export default function KanbanBoard({ leads, updateLead, onEdit, onAddLead, onUpdate }) {
  const [activeId,    setActiveId]    = useState(null)
  const [pendingDrop, setPendingDrop] = useState(null)   // { lead, newStage }
  const [lostReason,  setLostReason]  = useState('')
  const [saving,      setSaving]      = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  // Group leads by stage
  const leadsByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.id] = leads.filter(l => l.pipeline_stage === stage.id)
    return acc
  }, {})

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null

  const handleDragStart = ({ active }) => setActiveId(active.id)

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null)
    if (!over) return

    const lead     = leads.find(l => l.id === active.id)
    const newStage = over.id

    if (!lead || lead.pipeline_stage === newStage) return

    if (newStage === 'lost') {
      setPendingDrop({ lead, newStage })
      setLostReason('')
    } else {
      await updateLead(lead.id, { pipeline_stage: newStage }, lead)
      onUpdate()
    }
  }

  const handleDragCancel = () => setActiveId(null)

  const confirmLost = async () => {
    if (!pendingDrop || !lostReason || saving) return
    setSaving(true)
    await updateLead(pendingDrop.lead.id, {
      pipeline_stage: 'lost',
      lost_reason:    lostReason,
    }, pendingDrop.lead)
    setSaving(false)
    setPendingDrop(null)
    setLostReason('')
    onUpdate()
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {/* Horizontal scrolling board */}
        <div className="flex gap-3 overflow-x-auto pb-4 pt-1 -mx-4 px-4">
          {PIPELINE_STAGES.map(stage => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              leads={leadsByStage[stage.id] || []}
              onEdit={onEdit}
              onAddLead={stage.id === 'new_lead' ? onAddLead : undefined}
            />
          ))}
        </div>

        {/* Drag ghost */}
        <DragOverlay dropAnimation={null}>
          {activeLead && (
            <div
              className="p-3 w-60 rotate-2"
              style={{
                borderRadius: 14,
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(24px) saturate(200%)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                border: '1px solid rgba(255,255,255,0.8)',
                boxShadow: '0 20px 48px rgba(0,0,0,0.20), 0 4px 12px rgba(0,0,0,0.12)',
              }}
            >
              <p className="font-bold text-sm truncate" style={{ color: '#0F1E3C' }}>{activeLead.full_name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(15,30,60,0.45)' }}>{activeLead.mobile}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Lost Reason Modal */}
      {pendingDrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-1">Mark as Lost</h3>
            <p className="text-sm text-gray-500 mb-4">
              Why is <span className="font-medium text-gray-800">{pendingDrop.lead.full_name}</span> being marked as lost?
            </p>

            <div className="space-y-2 mb-5 max-h-56 overflow-y-auto">
              {LOST_REASONS.map(reason => (
                <label key={reason} className="flex items-center gap-3 cursor-pointer group py-0.5">
                  <input
                    type="radio"
                    name="lost_reason"
                    value={reason}
                    checked={lostReason === reason}
                    onChange={() => setLostReason(reason)}
                    className="accent-brand-blue"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setPendingDrop(null); setLostReason('') }}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmLost}
                disabled={!lostReason || saving}
                className="flex-1 py-2.5 bg-brand-red text-white rounded-xl text-sm font-medium disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Mark Lost'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
