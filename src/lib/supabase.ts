import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn('Supabase environment variables are not configured yet.')
}

const clientUrl = supabaseUrl ?? 'https://placeholder.supabase.co'
const publishableKey = supabasePublishableKey ?? 'placeholder-key'

export const supabase = createClient(clientUrl, publishableKey)
export const publicSupabase = createClient(clientUrl, publishableKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
})

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)
