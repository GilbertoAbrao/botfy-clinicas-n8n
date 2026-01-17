import { createServerClient } from '@/lib/supabase/server'

/**
 * Notify waitlist when appointment slot becomes available
 * Called when appointment is cancelled or rescheduled
 */
export async function notifyWaitlist(
  cancelledAppointment: {
    servicoTipo: string
    providerId?: string | null
    dataHora: Date
  }
) {
  try {
    const supabase = await createServerClient()

    // Build query for waitlist entries
    let query = supabase
      .from('waitlist')
      .select(`
        *,
        paciente:patients!waitlist_paciente_id_fkey(id, nome, telefone)
      `)
      .eq('servico_tipo', cancelledAppointment.servicoTipo)
      .eq('status', 'ACTIVE')
      .order('priority', { ascending: false })  // URGENT first
      .order('created_at', { ascending: true })  // FIFO
      .limit(5)  // Notify top 5 candidates

    // Filter by provider if specified
    if (cancelledAppointment.providerId) {
      query = query.or(`provider_id.is.null,provider_id.eq.${cancelledAppointment.providerId}`)
    }

    const { data: waitlistEntries, error: queryError } = await query

    if (queryError) throw queryError

    if (!waitlistEntries || waitlistEntries.length === 0) {
      console.log('No active waitlist entries for cancelled slot')
      return
    }

    // Trigger N8N workflow to send WhatsApp notifications
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_WAITLIST_NOTIFY

    if (!n8nWebhookUrl) {
      console.warn('N8N_WEBHOOK_WAITLIST_NOTIFY not configured, skipping notifications')
      return
    }

    for (const entry of waitlistEntries) {
      try {
        // Call N8N webhook to send WhatsApp message
        await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientPhone: entry.paciente.telefone,
            patientName: entry.paciente.nome,
            availableSlot: cancelledAppointment.dataHora.toISOString(),
            serviceName: cancelledAppointment.servicoTipo,
            waitlistId: entry.id,
          }),
        })

        // Update waitlist status to NOTIFIED
        await supabase
          .from('waitlist')
          .update({ status: 'NOTIFIED' })
          .eq('id', entry.id)

        console.log(`Waitlist notification sent to ${entry.paciente.nome}`)
      } catch (error) {
        console.error(`Failed to notify waitlist entry ${entry.id}:`, error)
      }
    }
  } catch (error) {
    console.error('Error in notifyWaitlist:', error)
  }
}
