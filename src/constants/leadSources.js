export const LEAD_SOURCES = [
  { id: 'website',         label: 'Website' },
  { id: 'instagram_fb',    label: 'Instagram / Facebook' },
  { id: '99acres',         label: '99acres' },
  { id: 'magicbricks',     label: 'MagicBricks' },
  { id: 'walkin',          label: 'Walk-in' },
  { id: 'referral',        label: 'Referral' },
  { id: 'channel_partner', label: 'Channel Partner' },
]

export const LEAD_TAGS = [
  'NRI',
  'Investor',
  'Urgent Buyer',
  'High Budget',
  'VIP Referral',
  'Repeat Customer',
  'Home Loan Required',
]

/** Tags that get a highlight color — others stay plain grey */
export const TAG_STYLES = {
  'Urgent Buyer': 'bg-red-100 text-red-700 border border-red-200',
  'VIP Referral': 'bg-amber-100 text-amber-700 border border-amber-200',
  'High Budget':  'bg-green-100 text-green-700 border border-green-200',
  'NRI':          'bg-blue-100 text-blue-700 border border-blue-200',
}

export const BUDGET_RANGES = [
  'Below 50L',
  '50L - 75L',
  '75L - 1Cr',
  '1Cr - 1.5Cr',
  '1.5Cr - 2Cr',
  'Above 2Cr',
]

export const LOST_REASONS = [
  'Price too high',
  'Location not suitable',
  'Bought competitor project',
  'Budget / financing issue',
  'Not reachable',
  'Timeline mismatch',
  'Only exploring',
  'Chose different unit in our project',
]
