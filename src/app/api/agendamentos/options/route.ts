import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/agendamentos/options
 * Returns patients and services for appointment form dropdowns
 * Uses agendamentos-compatible tables (pacientes, servicos with integer IDs)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserWithRole()
    if (!user || !['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminSupabaseClient()

    // Fetch patients from pacientes table (integer IDs)
    const { data: patients, error: patientsError } = await supabase
      .from('pacientes')
      .select('id, nome, telefone')
      .order('nome')
      .limit(500)

    if (patientsError) {
      console.error('[API agendamentos/options] Error fetching patients:', patientsError)
      return NextResponse.json({ error: 'Erro ao buscar pacientes' }, { status: 500 })
    }

    // Fetch services from servicos table (integer IDs)
    const { data: services, error: servicesError } = await supabase
      .from('servicos')
      .select('id, nome, duracao_minutos, preco')
      .eq('ativo', true)
      .order('nome')

    if (servicesError) {
      console.error('[API agendamentos/options] Error fetching services:', servicesError)
      return NextResponse.json({ error: 'Erro ao buscar serviços' }, { status: 500 })
    }

    return NextResponse.json({
      patients: patients || [],
      services: services || [],
    })
  } catch (error) {
    console.error('[API agendamentos/options] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
