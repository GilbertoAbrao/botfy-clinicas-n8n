'use client'

import { useEffect, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Alert } from '@prisma/client'

// Payload types for real-time changes
export type AlertChangePayload = RealtimePostgresChangesPayload<Alert>

export type AlertEventType = 'INSERT' | 'UPDATE' | 'DELETE'

export type SubscriptionStatus = 'subscribed' | 'error' | 'disconnected'

export interface AlertChangeEvent {
  eventType: AlertEventType
  new: Alert | null
  old: Alert | null
}

export interface SubscriptionState {
  status: SubscriptionStatus
  error?: string
}

/**
 * Hook for subscribing to real-time alert changes
 *
 * Automatically subscribes on mount and cleans up on unmount.
 * Follows Phase 1 memory leak prevention patterns.
 *
 * @param onAlertChange - Callback fired when alerts change (INSERT, UPDATE, DELETE)
 * @param onStatusChange - Optional callback for connection status changes
 * @returns Current subscription status
 */
export function useAlertSubscription(
  onAlertChange: (event: AlertChangeEvent) => void,
  onStatusChange?: (state: SubscriptionState) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const statusRef = useRef<SubscriptionStatus>('disconnected')

  useEffect(() => {
    // Create Supabase client
    const supabase = createBrowserClient()

    // Create channel for alerts table
    const channel = supabase
      .channel('alerts-changes')
      .on<Alert>(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'Alert',
        },
        (payload: RealtimePostgresChangesPayload<Alert>) => {
          // Transform payload to our event type
          const event: AlertChangeEvent = {
            eventType: payload.eventType as AlertEventType,
            new: payload.new as Alert | null,
            old: payload.old as Alert | null,
          }

          // Only fire callback if event is relevant
          if (event.eventType === 'INSERT' && event.new) {
            onAlertChange(event)
          } else if (event.eventType === 'UPDATE' && event.new) {
            onAlertChange(event)
          } else if (event.eventType === 'DELETE' && event.old) {
            onAlertChange(event)
          }
        }
      )
      .on('system', (payload: any) => {
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
        console.log('[Supabase Realtime] Unsubscribing from alerts channel')
      }

      if (channelRef.current) {
        // Remove all listeners and unsubscribe
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [onAlertChange, onStatusChange])

  return statusRef.current
}

/**
 * Hook for subscribing to real-time changes for a single alert
 *
 * Used in alert detail view to show updates when another user modifies the alert.
 *
 * @param alertId - ID of the alert to subscribe to
 * @param onAlertUpdate - Callback fired when this specific alert is updated
 * @param onStatusChange - Optional callback for connection status changes
 * @returns Current subscription status
 */
export function useAlertDetailSubscription(
  alertId: string,
  onAlertUpdate: (alert: Alert) => void,
  onStatusChange?: (state: SubscriptionState) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const statusRef = useRef<SubscriptionStatus>('disconnected')

  useEffect(() => {
    if (!alertId) return

    const supabase = createBrowserClient()

    // Create channel for specific alert
    const channel = supabase
      .channel(`alert-${alertId}`)
      .on<Alert>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Alert',
          filter: `id=eq.${alertId}`,
        },
        (payload: RealtimePostgresChangesPayload<Alert>) => {
          if (payload.new) {
            onAlertUpdate(payload.new as Alert)
          }
        }
      )
      .on('system', (payload: any) => {
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
            console.log('[Supabase Realtime] Alert detail status:', newStatus, payload)
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
            onStatusChange({ status: 'error', error: 'Failed to subscribe to alert' })
          }
        }
      })

    channelRef.current = channel

    // Cleanup - CRITICAL for memory leak prevention
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Supabase Realtime] Unsubscribing from alert detail channel')
      }

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [alertId, onAlertUpdate, onStatusChange])

  return statusRef.current
}
