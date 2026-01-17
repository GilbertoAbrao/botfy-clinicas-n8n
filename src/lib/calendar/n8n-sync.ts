/**
 * N8N Integration for Calendar Sync
 *
 * Triggers N8N workflows when appointments are created, updated, or cancelled.
 * Ensures automated reminders and notifications continue working for manual appointments.
 *
 * DST Handling:
 * - All times are stored and transmitted as ISO 8601 with timezone
 * - N8N receives timezone-aware timestamps
 * - Brazil DST transitions (America/Sao_Paulo) handled by TZDate in calling code
 */

export interface AppointmentWebhookPayload {
  appointmentId: string
  patientId: string
  serviceId: string
  providerId: string
  dataHora: string // ISO 8601 format with timezone
  status: string
  patientName?: string
  patientPhone?: string
  serviceName?: string
  providerName?: string
}

export interface AppointmentUpdatePayload {
  appointmentId: string
  changes: {
    dataHora?: string
    status?: string
    providerId?: string
    serviceId?: string
  }
}

export interface WaitlistNotifyPayload {
  patientPhone: string
  patientName: string
  availableSlot: string // ISO 8601 format
  serviceName: string
  waitlistId: string
}

/**
 * Trigger N8N webhook when appointment is created
 * Used to schedule reminders (7 days, 24h, 2h before appointment)
 */
export async function notifyN8NAppointmentCreated(
  payload: AppointmentWebhookPayload
): Promise<void> {
  const webhookUrl = process.env.N8N_WEBHOOK_APPOINTMENT_CREATED

  if (!webhookUrl || webhookUrl.includes('your-n8n-instance.com')) {
    console.warn(
      'N8N_WEBHOOK_APPOINTMENT_CREATED not configured, skipping sync'
    )
    return
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`N8N webhook failed: ${response.status}`)
    }

    console.log(
      `N8N: Appointment created notification sent for ${payload.appointmentId}`
    )
  } catch (error) {
    console.error('Failed to notify N8N of appointment creation:', error)
    // Don't throw - webhook failure shouldn't block appointment creation
  }
}

/**
 * Trigger N8N webhook when appointment is updated
 * Used to reschedule reminders when time/date changes
 */
export async function notifyN8NAppointmentUpdated(
  payload: AppointmentUpdatePayload
): Promise<void> {
  const webhookUrl = process.env.N8N_WEBHOOK_APPOINTMENT_UPDATED

  if (!webhookUrl || webhookUrl.includes('your-n8n-instance.com')) {
    console.warn(
      'N8N_WEBHOOK_APPOINTMENT_UPDATED not configured, skipping sync'
    )
    return
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`N8N webhook failed: ${response.status}`)
    }

    console.log(
      `N8N: Appointment updated notification sent for ${payload.appointmentId}`
    )
  } catch (error) {
    console.error('Failed to notify N8N of appointment update:', error)
    // Don't throw - webhook failure shouldn't block appointment update
  }
}

/**
 * Trigger N8N webhook when appointment is cancelled
 * Used to cancel scheduled reminders and trigger waitlist notifications
 */
export async function notifyN8NAppointmentCancelled(
  payload: AppointmentWebhookPayload
): Promise<void> {
  const webhookUrl = process.env.N8N_WEBHOOK_APPOINTMENT_CANCELLED

  if (!webhookUrl || webhookUrl.includes('your-n8n-instance.com')) {
    console.warn(
      'N8N_WEBHOOK_APPOINTMENT_CANCELLED not configured, skipping sync'
    )
    return
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`N8N webhook failed: ${response.status}`)
    }

    console.log(
      `N8N: Appointment cancelled notification sent for ${payload.appointmentId}`
    )
  } catch (error) {
    console.error('Failed to notify N8N of appointment cancellation:', error)
    // Don't throw - webhook failure shouldn't block appointment cancellation
  }
}

/**
 * Trigger N8N webhook to notify waitlist patient
 * Called when appointment is cancelled and waitlist patient matches criteria
 */
export async function notifyN8NWaitlistPatient(
  payload: WaitlistNotifyPayload
): Promise<void> {
  const webhookUrl = process.env.N8N_WEBHOOK_WAITLIST_NOTIFY

  if (!webhookUrl || webhookUrl.includes('your-n8n-instance.com')) {
    console.warn('N8N_WEBHOOK_WAITLIST_NOTIFY not configured, skipping sync')
    return
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`N8N webhook failed: ${response.status}`)
    }

    console.log(
      `N8N: Waitlist notification sent for patient ${payload.patientName}`
    )
  } catch (error) {
    console.error('Failed to notify N8N of waitlist availability:', error)
    // Don't throw - webhook failure shouldn't block waitlist operations
  }
}
