import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
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

export const getCurrentUserWithRole = cache(async () => {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  // Fetch user from database to get role
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, role: true },
  })

  if (!dbUser) {
    return null
  }

  return dbUser
})
