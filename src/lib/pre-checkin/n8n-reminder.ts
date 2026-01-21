import { differenceInHours } from 'date-fns'
import { TZDate } from '@date-fns/tz'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Check if a reminder can be sent for a pre-checkin (rate limited to 1 per 4 hours)
 */
export async function canSendReminder(preCheckinId: string): Promise<{
  canSend: boolean
  hoursRemaining?: number
}> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('pre_checkin')
    .select('lembrete_enviado_em')
    .eq('id', preCheckinId)
    .single()

  if (error || !data) {
    return { canSend: false }
  }

  if (!data.lembrete_enviado_em) {
    return { canSend: true }
  }

  const now = new TZDate(new Date(), 'America/Sao_Paulo')
  const lastReminder = new TZDate(data.lembrete_enviado_em, 'America/Sao_Paulo')
  const hoursSince = differenceInHours(now, lastReminder)

  if (hoursSince < 4) {
    return {
      canSend: false,
      hoursRemaining: Math.ceil(4 - hoursSince),
    }
  }

  return { canSend: true }
}

/**
 * Send a pre-checkin reminder via N8N webhook
 *
 * Rate limited to 1 reminder per 4 hours.
 * Updates lembrete_enviado_em timestamp on success.
 */
export async function sendPreCheckinReminder(
  preCheckinId: string
): Promise<{ success: boolean }> {
  const supabase = await createServerSupabaseClient()

  // Check rate limit
  const rateCheck = await canSendReminder(preCheckinId)
  if (!rateCheck.canSend) {
    throw new Error(
      `Proximo envio disponivel em ${rateCheck.hoursRemaining} horas`
    )
  }

  // Fetch pre-checkin with related data
  const { data: preCheckin, error: fetchError } = await supabase
    .from('pre_checkin')
    .select(
      `
      *,
      agendamento:agendamentos!pre_checkin_agendamento_id_fkey(
        id,
        data_hora
      ),
      paciente:pacientes!pre_checkin_paciente_id_fkey(
        id,
        nome,
        telefone
      )
    `
    )
    .eq('id', preCheckinId)
    .single()

  if (fetchError || !preCheckin) {
    throw new Error('Pre-checkin nao encontrado')
  }

  // Handle array results from Supabase joins
  const agendamento = Array.isArray(preCheckin.agendamento)
    ? preCheckin.agendamento[0]
    : preCheckin.agendamento
  const paciente = Array.isArray(preCheckin.paciente)
    ? preCheckin.paciente[0]
    : preCheckin.paciente

  // Call N8N webhook
  const webhookUrl = process.env.N8N_WEBHOOK_PRE_CHECKIN_REMINDER

  if (!webhookUrl) {
    console.warn('[sendPreCheckinReminder] N8N webhook not configured')
    // Don't throw - allow graceful degradation in dev
    // In production, this should be configured
  } else {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preCheckinId: preCheckin.id,
          patientPhone: paciente?.telefone,
          patientName: paciente?.nome,
          appointmentDateTime: agendamento?.data_hora,
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao enviar lembrete via N8N')
      }
    } catch (error) {
      console.error('[sendPreCheckinReminder] Webhook error:', error)
      throw new Error('Erro ao enviar lembrete. Tente novamente.')
    }
  }

  // Update lembrete_enviado_em timestamp
  const { error: updateError } = await supabase
    .from('pre_checkin')
    .update({ lembrete_enviado_em: new Date().toISOString() })
    .eq('id', preCheckinId)

  if (updateError) {
    console.error(
      '[sendPreCheckinReminder] Failed to update timestamp:',
      updateError
    )
  }

  return { success: true }
}
