/**
 * Supabase Real-time Cleanup Utilities
 *
 * MEMORY LEAK PREVENTION PATTERNS
 * ================================
 *
 * Based on Phase 1 research: Supabase real-time subscriptions can cause memory leaks
 * if not properly cleaned up. This module documents patterns and provides utilities
 * for safe subscription management.
 *
 * CRITICAL: Every subscription MUST have a cleanup function in useEffect return.
 */

import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'

/**
 * ✅ CORRECT PATTERN: Cleanup subscription on unmount
 *
 * @example
 * useEffect(() => {
 *   const supabase = createBrowserClient()
 *
 *   const channel = supabase
 *     .channel('my-channel')
 *     .on('postgres_changes', {...}, callback)
 *     .subscribe()
 *
 *   // CRITICAL: Return cleanup function
 *   return () => {
 *     supabase.removeChannel(channel)
 *   }
 * }, [])
 */

/**
 * ❌ INCORRECT PATTERN: No cleanup (memory leak)
 *
 * @example
 * useEffect(() => {
 *   const supabase = createBrowserClient()
 *
 *   supabase
 *     .channel('my-channel')
 *     .on('postgres_changes', {...}, callback)
 *     .subscribe()
 *
 *   // ❌ No cleanup - channel persists after unmount
 *   // ❌ Multiple mounts = multiple subscriptions = memory leak
 * }, [])
 */

/**
 * Cleanup a Supabase real-time channel
 *
 * Removes all event listeners and unsubscribes from the channel.
 * Should be called in useEffect cleanup function.
 *
 * @param supabase - Supabase client instance
 * @param channel - Channel to cleanup
 *
 * @example
 * useEffect(() => {
 *   const supabase = createBrowserClient()
 *   const channel = supabase.channel('my-channel').on(...).subscribe()
 *
 *   return () => cleanupSubscription(supabase, channel)
 * }, [])
 */
export function cleanupSubscription(
  supabase: SupabaseClient,
  channel: RealtimeChannel | null
): void {
  if (!channel) return

  try {
    // Remove channel and all its listeners
    supabase.removeChannel(channel)

    // Log cleanup in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[Supabase Realtime] Channel cleaned up:', channel.topic)
    }
  } catch (error) {
    // Log error but don't throw - cleanup should be silent
    console.error('[Supabase Realtime] Cleanup error:', error)
  }
}

/**
 * Cleanup multiple channels at once
 *
 * Useful when a component has multiple subscriptions.
 *
 * @param supabase - Supabase client instance
 * @param channels - Array of channels to cleanup
 *
 * @example
 * useEffect(() => {
 *   const supabase = createBrowserClient()
 *   const channel1 = supabase.channel('alerts').on(...).subscribe()
 *   const channel2 = supabase.channel('messages').on(...).subscribe()
 *
 *   return () => cleanupMultipleSubscriptions(supabase, [channel1, channel2])
 * }, [])
 */
export function cleanupMultipleSubscriptions(
  supabase: SupabaseClient,
  channels: (RealtimeChannel | null)[]
): void {
  channels.forEach((channel) => {
    if (channel) {
      cleanupSubscription(supabase, channel)
    }
  })
}

/**
 * MEMORY LEAK DETECTION GUIDE
 * ============================
 *
 * How to detect memory leaks from real-time subscriptions:
 *
 * 1. Open Chrome DevTools → Memory tab
 * 2. Take heap snapshot
 * 3. Open and close page with subscriptions 10 times
 * 4. Take another heap snapshot
 * 5. Compare snapshots
 *
 * Look for:
 * - Increasing number of RealtimeChannel objects
 * - Increasing number of WebSocket connections
 * - Growing heap size after page closes
 *
 * If you see these patterns, check:
 * - All useEffect hooks with subscriptions have cleanup functions
 * - Cleanup functions call supabase.removeChannel()
 * - No circular references in subscription callbacks
 */

/**
 * COMMON PITFALLS
 * ===============
 *
 * 1. Forgetting cleanup function:
 *    ❌ useEffect(() => { subscribe() }, [])
 *    ✅ useEffect(() => { const ch = subscribe(); return () => cleanup(ch) }, [])
 *
 * 2. Not storing channel reference:
 *    ❌ supabase.channel().subscribe() // Can't cleanup later
 *    ✅ const ch = supabase.channel().subscribe(); return () => cleanup(ch)
 *
 * 3. Cleanup doesn't actually unsubscribe:
 *    ❌ return () => { channel.unsubscribe() } // Doesn't remove from client
 *    ✅ return () => { supabase.removeChannel(channel) } // Removes from client
 *
 * 4. Multiple subscriptions to same channel:
 *    ❌ Component mounts multiple times, each creates new subscription
 *    ✅ Use useRef to prevent duplicate subscriptions
 *
 * 5. Circular references in callbacks:
 *    ❌ callback references component state that references callback
 *    ✅ Use stable callback refs or dependency array carefully
 */

/**
 * TESTING CLEANUP
 * ===============
 *
 * Test that cleanup works:
 *
 * 1. Manual testing:
 *    - Open page with real-time
 *    - Check Network tab for WebSocket connection
 *    - Close page
 *    - Verify WebSocket closes (status "canceled" or "finished")
 *
 * 2. React DevTools:
 *    - Install React DevTools
 *    - Open Components tab
 *    - Mount/unmount component
 *    - Check "Hooks" section for stale refs
 *
 * 3. Memory profiling:
 *    - Chrome DevTools → Memory → Take snapshot
 *    - Open/close page 10 times
 *    - Take another snapshot
 *    - Filter by "RealtimeChannel" or "WebSocket"
 *    - Should see no growth in channel count
 */
