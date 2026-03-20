import { createClient } from '@supabase/supabase-js'

const insforgeUrl = import.meta.env.VITE_INSFORGE_URL
const insforgeKey = import.meta.env.VITE_INSFORGE_ANON_KEY

if (!insforgeUrl || !insforgeKey) {
  console.warn('InsForge env vars not set — check .env.local')
}

export const insforge = createClient(insforgeUrl, insforgeKey)
