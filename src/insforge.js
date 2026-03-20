import { createClient } from '@insforge/sdk'

const baseUrl = import.meta.env.VITE_INSFORGE_URL
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY

if (!baseUrl || !anonKey) {
  console.warn('InsForge env vars not set — check .env.local')
}

export const insforge = createClient({ baseUrl, anonKey })
