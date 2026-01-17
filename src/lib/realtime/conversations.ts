'use client'

import { useEffect, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Conversation } from '@prisma/client'

// Payload types for real-time changes
export type ConversationChangePayload = RealtimePostgresChangesPayload<Conversation>

export type ConversationEventType = 'INSERT' | 'UPDATE' | 'DELETE'

export type SubscriptionStatus = 'subscribed' | 'error' | 'disconnected'

export interface ConversationChangeEvent {
  eventType: ConversationEventType
  new: Conversation | null
  old: Conversation | null
}

export interface SubscriptionState {
  status: SubscriptionStatus
  error?: string
}

/**
 * Hook for subscribing to real-time conversation changes
 *
 * Automatically subscribes on mount and cleans up on unmount.
 * Follows Phase 1 memory leak prevention patterns.
 *
 * @param onConversationChange - Callback fired when conversations change (INSERT, UPDATE, DELETE)
 * @param onStatusChange - Optional callback for connection status changes
 * @returns Current subscription status
 */
export function useConversationSubscription(
  onConversationChange: (event: ConversationChangeEvent) => void,
  onStatusChange?: (state: SubscriptionState) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const statusRef = useRef<SubscriptionStatus>('disconnected')

  useEffect(() => {
    // Create Supabase client
    const supabase = createBrowserClient()

    // Create channel for conversations table
    const channel = supabase
      .channel('conversations-changes')
      .on<Conversation>(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'conversations',
        },
        (payload: RealtimePostgresChangesPayload<Conversation>) => {
          // Transform payload to our event type
          const event: ConversationChangeEvent = {
            eventType: payload.eventType as ConversationEventType,
            new: payload.new as Conversation | null,
            old: payload.old as Conversation | null,
          }

          // Only fire callback if event is relevant
          if (event.eventType === 'INSERT' && event.new) {
            onConversationChange(event)
          } else if (event.eventType === 'UPDATE' && event.new) {
            onConversationChange(event)
          } else if (event.eventType === 'DELETE' && event.old) {
            onConversationChange(event)
          }
        }
      )
      .on('system', {}, (payload: any) => {
        // Handle connection status changes
        if (payload.status) {
          const newStatus: SubscriptionStatus =
            payload.status === 'ok' ? 'subscribed' :
            payload.status === 'error' ? 'error' : 'disconnected'

          statusRef.current = newStatus

          if (onStatusChange) {
            onStatusChange({
              status: newStatus,
              error: payload.error?.message,
            })
          }

          // Log status changes in development
          if (process.env.NODE_ENV === 'development') {
            console.log('[Supabase Realtime] Status:', newStatus, payload)
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          statusRef.current = 'subscribed'
          if (onStatusChange) {
            onStatusChange({ status: 'subscribed' })
          }
        } else if (status === 'CHANNEL_ERROR') {
          statusRef.current = 'error'
          if (onStatusChange) {
            onStatusChange({ status: 'error', error: 'Failed to subscribe to channel' })
          }
        }
      })

    // Store channel reference for cleanup
    channelRef.current = channel

    // Cleanup function - CRITICAL for memory leak prevention
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Supabase Realtime] Unsubscribing from conversations channel')
      }

      if (channelRef.current) {
        // Remove all listeners and unsubscribe
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [onConversationChange, onStatusChange])

  return statusRef.current
}

/**
 * Hook for subscribing to real-time changes for a single conversation
 *
 * Used in conversation detail view to show updates when messages arrive.
 *
 * @param conversationId - ID of the conversation to subscribe to
 * @param onConversationUpdate - Callback fired when this specific conversation is updated
 * @param onStatusChange - Optional callback for connection status changes
 * @returns Current subscription status
 */
export function useConversationDetailSubscription(
  conversationId: string,
  onConversationUpdate: (conversation: Conversation) => void,
  onStatusChange?: (state: SubscriptionState) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const statusRef = useRef<SubscriptionStatus>('disconnected')

  useEffect(() => {
    if (!conversationId) return

    const supabase = createBrowserClient()

    // Create channel for specific conversation
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on<Conversation>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`,
        },
        (payload: RealtimePostgresChangesPayload<Conversation>) => {
          if (payload.new) {
            onConversationUpdate(payload.new as Conversation)
          }
        }
      )
      .on('system', {}, (payload: any) => {
        if (payload.status) {
          const newStatus: SubscriptionStatus =
            payload.status === 'ok' ? 'subscribed' :
            payload.status === 'error' ? 'error' : 'disconnected'

          statusRef.current = newStatus

          if (onStatusChange) {
            onStatusChange({
              status: newStatus,
              error: payload.error?.message,
            })
          }

          if (process.env.NODE_ENV === 'development') {
            console.log('[Supabase Realtime] Conversation detail status:', newStatus, payload)
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          statusRef.current = 'subscribed'
          if (onStatusChange) {
            onStatusChange({ status: 'subscribed' })
          }
        } else if (status === 'CHANNEL_ERROR') {
          statusRef.current = 'error'
          if (onStatusChange) {
            onStatusChange({ status: 'error', error: 'Failed to subscribe to conversation' })
          }
        }
      })

    channelRef.current = channel

    // Cleanup - CRITICAL for memory leak prevention
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Supabase Realtime] Unsubscribing from conversation detail channel')
      }

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [conversationId, onConversationUpdate, onStatusChange])

  return statusRef.current
}
