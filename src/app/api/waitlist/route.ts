import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logAudit, AuditAction } from '@/lib/audit/logger'
import { z } from 'zod'

const createWaitlistSchema = z.object({
  pacienteId: z.string().uuid(),
  servicoTipo: z.string(),
  providerId: z.string().uuid().optional(),
  priority: z.enum(['URGENT', 'CONVENIENCE']).default('CONVENIENCE'),
  preferredDate: z.string().datetime().optional(),
  notes: z.string().optional(),
})

// GET: List waitlist entries (priority queue)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()

    // Query waitlist ordered by priority (URGENT first), then creation date
    const { data, error } = await supabase
      .from('waitlist')
      .select(`
        *,
        paciente:patients!waitlist_paciente_id_fkey(id, nome, telefone),
        provider:providers!waitlist_provider_id_fkey(id, nome)
      `)
      .eq('status', 'ACTIVE')
      .order('priority', { ascending: false })  // URGENT before CONVENIENCE
      .order('created_at', { ascending: true })  // FIFO within priority

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching waitlist:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Add to waitlist
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserWithRole()
    if (!user || !['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createWaitlistSchema.parse(body)

    const supabase = await createServerSupabaseClient()

    // Check for duplicate entry (same patient + service + ACTIVE status)
    const { data: existing } = await supabase
      .from('waitlist')
      .select('id')
      .eq('paciente_id', validatedData.pacienteId)
      .eq('servico_tipo', validatedData.servicoTipo)
      .eq('status', 'ACTIVE')
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Paciente já está na lista de espera para este serviço' },
        { status: 409 }
      )
    }

    // Calculate expiry date (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Insert waitlist entry
    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        paciente_id: validatedData.pacienteId,
        servico_tipo: validatedData.servicoTipo,
        provider_id: validatedData.providerId,
        priority: validatedData.priority,
        preferred_date: validatedData.preferredDate,
        notes: validatedData.notes,
        status: 'ACTIVE',
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    // Audit log
    await logAudit({
      userId: user.id,
      action: AuditAction.ADD_WAITLIST,
      resource: 'waitlist',
      resourceId: data.id,
      details: validatedData,
    })

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error adding to waitlist:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
