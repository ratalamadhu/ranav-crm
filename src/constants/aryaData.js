// ARYA unit layout — 8 positions per typical residential floor
// Source: Ranav ARYA Mobile Brochure (MMXXVI)
export const ARYA_UNITS = [
  { unit: 1, name: 'Nocturne',  config: '2 BHK · 2T', sft: 1288, facing: 'E' },
  { unit: 2, name: 'Cantabile', config: '3 BHK · 3T', sft: 1862, facing: 'W' },
  { unit: 3, name: 'Sonata',    config: '3 BHK · 3T', sft: 1851, facing: 'N' },
  { unit: 4, name: 'Aria',      config: '3 BHK · 2T', sft: 1596, facing: 'N' },
  { unit: 5, name: 'Aria',      config: '3 BHK · 2T', sft: 1596, facing: 'N' },
  { unit: 6, name: 'Prelude',   config: '3 BHK · 3T', sft: 1867, facing: 'E' },
  { unit: 7, name: 'Maestro',   config: '4 BHK · 3T', sft: 2280, facing: 'E' },
  { unit: 8, name: 'Cadence',   config: '2 BHK · 2T', sft: 1287, facing: 'W' },
]

// Residential floors: 2nd to 32nd (Ground + 1st = amenities)
export const ARYA_FLOORS = Array.from({ length: 31 }, (_, i) => 32 - i) // 32 down to 2

export const ARYA_TOTAL_UNITS = ARYA_FLOORS.length * ARYA_UNITS.length // 248

export const BLOCK_TYPES = ['Presales', 'EOI', 'Agent Block', 'Management Hold']

// unit_id format: "32-01" = floor 32, unit position 1
export function aryaUnitId(floor, unit) {
  return `${String(floor).padStart(2, '0')}-${String(unit).padStart(2, '0')}`
}
