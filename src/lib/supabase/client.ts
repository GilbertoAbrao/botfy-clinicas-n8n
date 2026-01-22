import { createBrowserClient as createClient } from '@supabase/ssr'

let browserClient: ReturnType<typeof createClient> | null = null

export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase Client] Missing environment variables:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
    })
    // Return a mock client that won't crash but won't work
    // This prevents the app from crashing when env vars are missing
    throw new Error('Supabase environment variables not configured')
  }

  // Singleton pattern - reuse the same client instance
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey)
  }

  return browserClient
}
