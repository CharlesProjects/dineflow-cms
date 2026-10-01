import { isSupabaseConfigured, supabase } from './supabase'

export type BusinessRole = 'ADMIN' | 'EDITOR' | 'VIEWER'

export type BusinessProfile = {
  id: string
  business_id: string
  role: BusinessRole
  full_name: string
  email: string | null
}

const publicBusinessId = import.meta.env.VITE_PUBLIC_BUSINESS_ID as string | undefined

export function getPublicBusinessId() {
  return publicBusinessId?.trim() || null
}

export async function getCurrentBusinessProfile(): Promise<BusinessProfile> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.')
  }

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Your session could not be verified. Please sign in again.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, business_id, role, full_name, email')
    .eq('id', userData.user.id)
    .single()

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? 'No restaurant profile is associated with this account.')
  }

  return profile as BusinessProfile
}
