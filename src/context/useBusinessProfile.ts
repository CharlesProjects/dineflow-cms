import { useEffect, useState } from 'react'
import type { BusinessProfile } from '../lib/tenant'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

type ProfileState = {
  userId: string | null
  profile: BusinessProfile | null
  error: string | null
}

const initialState: ProfileState = {
  userId: null,
  profile: null,
  error: null,
}

export function useBusinessProfile() {
  const { user } = useAuth()
  const userId = user?.id
  const [state, setState] = useState(initialState)

  useEffect(() => {
    if (!userId) return

    let isActive = true

    supabase
      .from('profiles')
      .select('id, business_id, role, full_name, email')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (!isActive) return

        if (error || !data) {
          setState({
            userId,
            profile: null,
            error: error?.message ?? 'No restaurant profile is associated with this account.',
          })
          return
        }

        setState({ userId, profile: data as BusinessProfile, error: null })
      })

    return () => {
      isActive = false
    }
  }, [userId])

  if (!user) {
    return { profile: null, loading: false, error: null }
  }

  if (state.userId !== userId) {
    return { profile: null, loading: true, error: null }
  }

  return { profile: state.profile, loading: false, error: state.error }
}
