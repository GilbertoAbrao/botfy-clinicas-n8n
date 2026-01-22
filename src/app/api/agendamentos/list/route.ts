import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import {
  appointmentFiltersSchema,
  AppointmentListItem,
  AppointmentStatus,
} from '@/lib/validations/appointment'

// Map English DB status to Portuguese frontend status
const STATUS_MAP: Record<string, AppointmentStatus> = {
  confirmed: 'confirmado',
  tentative: 'agendada',
  cancelled: 'cancelada',
  completed: 'realizada',
  no_show: 'faltou',
}

// Map Portuguese frontend status to English DB status for filtering
const STATUS_MAP_REVERSE: Record<AppointmentStatus, string> = {
  confirmado: 'confirmed',
  agendada: 'tentative',
  cancelada: 'cancelled',
  realizada: 'completed',
  faltou: 'no_show',
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const user = await getCurrentUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // 2. Authorization - ADMIN and ATENDENTE can view appointments
    if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Sem permissão para visualizar agendamentos' },
        { status: 403 }
      )
    }

    // 3. Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const params = appointmentFiltersSchema.parse(searchParams)

    const { page, limit, dateStart, dateEnd, providerId, serviceType, status, search } = params
    const offset = (page - 1) * limit

    // 4. Build Supabase query (using admin client since user is already authenticated above)
    const supabase = createAdminSupabaseClient()

    let query = supabase
      .from('appointments')
      .select(
        `
        id,
        scheduled_at,
        service_type,
        status,
        duration,
        patient:patients!patient_id (id, nome, telefone),
        provider:providers!provider_id (id, nome, cor_calendario)
      `,
        { count: 'exact' }
      )

    // 5. Apply filters
    if (dateStart) {
      query = query.gte('scheduled_at', dateStart)
    }
    if (dateEnd) {
      query = query.lte('scheduled_at', dateEnd)
    }

    // Provider filter - support comma-separated list for multi-select
    if (providerId) {
      const providerIds = providerId.split(',').map(id => id.trim())
      query = query.in('provider_id', providerIds)
    }

    if (serviceType) {
      query = query.eq('service_type', serviceType)
    }

    if (status) {
      // Convert Portuguese status to English for DB query
      const dbStatus = STATUS_MAP_REVERSE[status]
      query = query.eq('status', dbStatus)
    }

    // Search filter - match on patient name OR phone (using OR with ilike for partial match)
    if (search) {
      // Note: Supabase doesn't support OR directly in the query builder for joined fields
      // We'll filter client-side after fetch if needed, or use RPC function
      // For now, let's fetch and filter in memory (acceptable for moderate data sizes)
    }

    // 6. Apply pagination and ordering
    query = query
      .order('scheduled_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      console.error('[API /agendamentos/list] Supabase error:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar agendamentos', details: error.message },
        { status: 500 }
      )
    }

    // 7. Transform response to AppointmentListItem format
    let appointments: AppointmentListItem[] = (data || []).map((apt: any) => {
      // Handle patient and provider data (can be arrays or objects)
      const patient = Array.isArray(apt.patient) ? apt.patient[0] : apt.patient
      const provider = Array.isArray(apt.provider) ? apt.provider[0] : apt.provider

      return {
        id: apt.id,
        scheduledAt: apt.scheduled_at,
        patientId: patient?.id || '',
        patientName: patient?.nome || 'Sem paciente',
        patientPhone: patient?.telefone || null,
        serviceType: apt.service_type,
        providerId: provider?.id || '',
        providerName: provider?.nome || 'Sem profissional',
        providerColor: provider?.cor_calendario || '#8B5CF6',
        status: STATUS_MAP[apt.status] || 'agendada',
        duration: apt.duration || 60,
      }
    })

    // Client-side filter for search (if search param provided)
    if (search) {
      const searchLower = search.toLowerCase()
      appointments = appointments.filter(
        apt =>
          apt.patientName.toLowerCase().includes(searchLower) ||
          (apt.patientPhone && apt.patientPhone.includes(search))
      )
    }

    // Adjust count if client-side filtering was applied
    const total = search ? appointments.length : (count || 0)
    const totalPages = Math.ceil(total / limit)

    // 8. Return response
    return NextResponse.json({
      appointments,
      pagination: { page, limit, total, totalPages },
    })
  } catch (error: any) {
    console.error('[API /agendamentos/list] Error:', error)
    console.error('[API /agendamentos/list] Error stack:', error?.stack)
    return NextResponse.json(
      {
        error: 'Erro ao buscar agendamentos',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    )
  }
}
