import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cache } from 'react'

export const getCurrentUser = cache(async () => {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
})
