export const PIPELINE_STAGES = [
  { id: 'new_lead',             label: 'New Lead',         color: '#6B7280' },
  { id: 'contacted',            label: 'Contacted',        color: '#3B82F6' },
  { id: 'site_visit_scheduled', label: 'Visit Scheduled',  color: '#8B5CF6' },
  { id: 'site_visit_done',      label: 'Visit Done',       color: '#F59E0B' },
  { id: 'negotiation',          label: 'Negotiation',      color: '#EF4444' },
  { id: 'booking_done',         label: 'Booking Done',     color: '#10B981' },
  { id: 'lost',                 label: 'Lost',             color: '#374151' },
]

export const STAGE_BY_ID = Object.fromEntries(
  PIPELINE_STAGES.map(s => [s.id, s])
)
