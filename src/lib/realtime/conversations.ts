'use client'

import { useEffect, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// Payload types for real-time changes on n8n_chat_histories
export type ChatHistoryPayload = RealtimePostgresChangesPayload<{
  id: number
  session_id: string
  message: any
}>

export type ChatHistoryEventType = 'INSERT' | 'UPDATE' | 'DELETE'

export type SubscriptionStatus = 'subscribed' | 'error' | 'disconnected'

export interface ChatHistoryChangeEvent {
  eventType: ChatHistoryEventType
  new: { id: number; session_id: string; message: any } | null
  old: { id: number; session_id: string; message: any } | null
}

export interface SubscriptionState {
  status: SubscriptionStatus
  error?: string
}

/**
 * Hook for subscribing to real-time chat history changes
 *
 * Automatically subscribes on mount and cleans up on unmount.
 * Follows Phase 1 memory leak prevention patterns.
 *
 * Monitors n8n_chat_histories table for new messages
 *
 * @param onChatHistoryChange - Callback fired when messages change (INSERT, UPDATE, DELETE)
 * @param onStatusChange - Optional callback for connection status changes
 * @returns Current subscription status
 */
export function useChatHistorySubscription(
  onChatHistoryChange: (event: ChatHistoryChangeEvent) => void,
  onStatusChange?: (state: SubscriptionState) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const statusRef = useRef<SubscriptionStatus>('disconnected')

  useEffect(() => {
    // Try to create Supabase client - may fail if env vars missing
    let supabase
    try {
      supabase = createBrowserClient()
    } catch (error) {
      console.warn('[Supabase Realtime] Failed to initialize client:', error)
      statusRef.current = 'error'
      if (onStatusChange) {
        onStatusChange({ status: 'error', error: 'Supabase not configured' })
      }
      return // Exit early, no cleanup needed
    }

    // Create channel for n8n_chat_histories table
    const channel = supabase
      .channel('chat-histories-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'n8n_chat_histories',
        },
        (payload: any) => {
          // Transform payload to our event type
          const event: ChatHistoryChangeEvent = {
            eventType: payload.eventType as ChatHistoryEventType,
            new: payload.new as any,
            old: payload.old as any,
          }

          // Only fire callback if event is relevant
          if (event.eventType === 'INSERT' && event.new) {
            onChatHistoryChange(event)
          } else if (event.eventType === 'UPDATE' && event.new) {
            onChatHistoryChange(event)
          } else if (event.eventType === 'DELETE' && event.old) {
            onChatHistoryChange(event)
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
            console.log('[Supabase Realtime] Chat History Status:', newStatus, payload)
          }
        }
      })
      .subscribe((status: string) => {
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
        console.log('[Supabase Realtime] Unsubscribing from chat histories channel')
      }

      if (channelRef.current) {
        // Remove all listeners and unsubscribe
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [onChatHistoryChange, onStatusChange])

  return statusRef.current
}
