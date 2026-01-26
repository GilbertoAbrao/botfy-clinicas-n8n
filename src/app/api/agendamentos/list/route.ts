import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import {
  appointmentFiltersSchema,
  AppointmentListItem,
  AppointmentStatus,
} from '@/lib/validations/appointment'

// Map Portuguese DB status (agendamentos table) to frontend status
// Note: agendamentos uses Portuguese status values directly
const STATUS_MAP_PT: Record<string, AppointmentStatus> = {
  agendada: 'agendada',
  confirmada: 'confirmado',
  cancelada: 'cancelada',
  realizada: 'realizada',
  no_show: 'faltou',
  presente: 'realizada', // Maps "presente" to "realizada"
  faltou: 'faltou',
}

// Map frontend status to Portuguese DB status for filtering
const STATUS_MAP_REVERSE_PT: Record<AppointmentStatus, string> = {
  agendada: 'agendada',
  confirmado: 'confirmada',
  cancelada: 'cancelada',
  realizada: 'realizada',
  faltou: 'faltou',
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
    // Query from 'agendamentos' table (N8N/legacy system) instead of 'appointments'
    const supabase = createAdminSupabaseClient()

    let query = supabase
      .from('agendamentos')
      .select(
        `
        id,
        data_hora,
        tipo_consulta,
        status,
        duracao_minutos,
        profissional,
        observacoes,
        paciente:pacientes!paciente_id (id, nome, telefone)
      `,
        { count: 'exact' }
      )

    // 5. Apply filters
    if (dateStart) {
      query = query.gte('data_hora', dateStart)
    }
    if (dateEnd) {
      query = query.lte('data_hora', dateEnd)
    }

    // Provider filter - filter by profissional name (string match)
    // Note: agendamentos uses 'profissional' as string name, not provider_id
    if (providerId) {
      // For backwards compatibility, we'll look up the provider name from the providers table
      // and filter by that name. providerId can be comma-separated UUIDs.
      const providerIds = providerId.split(',').map(id => id.trim())
      const { data: providers } = await supabase
        .from('providers')
        .select('nome')
        .in('id', providerIds)

      if (providers && providers.length > 0) {
        const providerNames = providers.map(p => p.nome)
        query = query.in('profissional', providerNames)
      }
    }

    if (serviceType) {
      query = query.eq('tipo_consulta', serviceType)
    }

    if (status) {
      // Use Portuguese status directly (agendamentos table uses Portuguese values)
      const dbStatus = STATUS_MAP_REVERSE_PT[status]
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
      .order('data_hora', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      console.error('[API /agendamentos/list] Supabase error:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar agendamentos', details: error.message },
        { status: 500 }
      )
    }

    // 7. Fetch provider colors for mapping profissional names
    // This allows calendar to show proper colors even though agendamentos uses names, not IDs
    const { data: allProviders } = await supabase
      .from('providers')
      .select('id, nome, cor_calendario')
      .eq('ativo', true)

    const providerColorMap = new Map<string, { id: string; cor: string }>()
    for (const p of allProviders || []) {
      providerColorMap.set(p.nome.toLowerCase(), { id: p.id, cor: p.cor_calendario })
    }

    // 8. Transform response to AppointmentListItem format
    // Note: agendamentos table uses different column names than appointments
    let appointments: AppointmentListItem[] = (data || []).map((apt: any) => {
      // Handle patient data (can be arrays or objects)
      const patient = Array.isArray(apt.paciente) ? apt.paciente[0] : apt.paciente

      // Lookup provider by name to get ID and color
      const providerInfo = apt.profissional
        ? providerColorMap.get(apt.profissional.toLowerCase())
        : null

      return {
        id: apt.id.toString(), // Convert int to string for compatibility
        scheduledAt: apt.data_hora,
        patientId: patient?.id?.toString() || '',
        patientName: patient?.nome || 'Sem paciente',
        patientPhone: patient?.telefone || null,
        serviceType: apt.tipo_consulta,
        providerId: providerInfo?.id || '',
        providerName: apt.profissional || 'Sem profissional',
        providerColor: providerInfo?.cor || '#8B5CF6',
        status: STATUS_MAP_PT[apt.status] || 'agendada',
        duration: apt.duracao_minutos || 30,
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
