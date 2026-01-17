import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { logAudit, AuditAction } from '@/lib/audit/logger'
import { subDays, parseISO, format } from 'date-fns'

/**
 * Valid export types
 */
const VALID_EXPORT_TYPES = ['appointments', 'alerts', 'kpis'] as const
type ExportType = (typeof VALID_EXPORT_TYPES)[number]

/**
 * GET /api/export
 *
 * Generates CSV export of clinic data.
 * ADMIN role required (HIPAA compliance - data export is sensitive).
 *
 * Query Parameters:
 * - type: 'appointments' | 'alerts' | 'kpis' (required)
 * - startDate: ISO date string (optional, default 30 days ago)
 * - endDate: ISO date string (optional, default now)
 *
 * Returns:
 * - CSV file as attachment
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  // Auth check
  const user = await getCurrentUserWithRole()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only ADMIN can export data (HIPAA compliance)
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Parse query parameters
  const searchParams = req.nextUrl.searchParams
  const type = searchParams.get('type') as ExportType | null
  const startDateStr = searchParams.get('startDate')
  const endDateStr = searchParams.get('endDate')

  // Validate export type
  if (!type || !VALID_EXPORT_TYPES.includes(type)) {
    return NextResponse.json(
      { error: 'Invalid export type. Must be: appointments, alerts, or kpis' },
      { status: 400 }
    )
  }

  // Parse dates
  const endDate = endDateStr ? parseISO(endDateStr) : new Date()
  const startDate = startDateStr ? parseISO(startDateStr) : subDays(endDate, 30)

  // Validate dates
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }

  try {
    let csv: string
    let filename: string

    switch (type) {
      case 'appointments':
        csv = await exportAppointments(startDate, endDate)
        filename = `agendamentos_${formatDateForFilename(startDate)}_${formatDateForFilename(endDate)}.csv`
        break
      case 'alerts':
        csv = await exportAlerts(startDate, endDate)
        filename = `alertas_${formatDateForFilename(startDate)}_${formatDateForFilename(endDate)}.csv`
        break
      case 'kpis':
        csv = await exportKPIs(startDate, endDate)
        filename = `metricas_${formatDateForFilename(startDate)}_${formatDateForFilename(endDate)}.csv`
        break
      default:
        throw new Error('Invalid type')
    }

    // Count rows for audit log (subtract 1 for header)
    const rowCount = csv.split('\n').length - 1

    // Audit log the export action (HIPAA compliance)
    await logAudit({
      userId: user.id,
      action: AuditAction.EXPORT_DATA,
      resource: type,
      details: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        rowCount,
      },
    })

    // Return CSV as attachment
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('[Export API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

/**
 * Export appointments to CSV
 */
async function exportAppointments(startDate: Date, endDate: Date): Promise<string> {
  const appointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      patient: {
        select: {
          nome: true,
          telefone: true,
        },
      },
      provider: {
        select: {
          nome: true,
        },
      },
    },
    orderBy: { scheduledAt: 'asc' },
  })

  // CSV header
  const header = 'id,patient_name,patient_phone,service_type,scheduled_at,status,provider,created_at'

  // CSV rows
  const rows = appointments.map((apt) => {
    return [
      escapeCSV(apt.id),
      escapeCSV(apt.patient?.nome || ''),
      escapeCSV(apt.patient?.telefone || ''),
      escapeCSV(apt.serviceType),
      escapeCSV(apt.scheduledAt.toISOString()),
      escapeCSV(apt.status),
      escapeCSV(apt.provider?.nome || ''),
      escapeCSV(apt.createdAt.toISOString()),
    ].join(',')
  })

  return [header, ...rows].join('\n')
}

/**
 * Export alerts to CSV
 */
async function exportAlerts(startDate: Date, endDate: Date): Promise<string> {
  const alerts = await prisma.alert.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      patient: {
        select: {
          nome: true,
        },
      },
      resolver: {
        select: {
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // CSV header
  const header = 'id,type,priority,status,patient_name,description,created_at,resolved_at,resolved_by'

  // CSV rows
  const rows = alerts.map((alert) => {
    return [
      escapeCSV(alert.id),
      escapeCSV(alert.type),
      escapeCSV(alert.priority),
      escapeCSV(alert.status),
      escapeCSV(alert.patient?.nome || ''),
      escapeCSV(alert.description || ''),
      escapeCSV(alert.createdAt.toISOString()),
      escapeCSV(alert.resolvedAt?.toISOString() || ''),
      escapeCSV(alert.resolver?.email || ''),
    ].join(',')
  })

  return [header, ...rows].join('\n')
}

/**
 * Export KPIs summary to CSV
 */
async function exportKPIs(startDate: Date, endDate: Date): Promise<string> {
  // Get appointment statistics
  const appointmentStats = await prisma.appointment.groupBy({
    by: ['status'],
    where: {
      scheduledAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: { status: true },
  })

  // Get alert statistics
  const alertStats = await prisma.alert.groupBy({
    by: ['type', 'status'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: { id: true },
  })

  // Build appointment counts
  const appointmentCounts: Record<string, number> = {}
  appointmentStats.forEach((stat) => {
    appointmentCounts[stat.status] = stat._count.status
  })

  const totalAppointments = Object.values(appointmentCounts).reduce((sum, count) => sum + count, 0)
  const completedConfirmed = (appointmentCounts['completed'] || 0) + (appointmentCounts['confirmed'] || 0)
  const bookingSuccessRate = totalAppointments > 0 ? ((completedConfirmed / totalAppointments) * 100).toFixed(1) : '0'
  const noShowRate = totalAppointments > 0 ? (((appointmentCounts['no_show'] || 0) / totalAppointments) * 100).toFixed(1) : '0'
  const cancellationRate = totalAppointments > 0 ? (((appointmentCounts['cancelled'] || 0) / totalAppointments) * 100).toFixed(1) : '0'

  // Build alert counts
  const alertCounts: Record<string, number> = {}
  let totalAlerts = 0
  let resolvedAlerts = 0
  alertStats.forEach((stat) => {
    const key = stat.type
    alertCounts[key] = (alertCounts[key] || 0) + stat._count.id
    totalAlerts += stat._count.id
    if (stat.status === 'resolved') {
      resolvedAlerts += stat._count.id
    }
  })

  // CSV header
  const header = 'metric,value,period_start,period_end'

  // CSV rows
  const rows = [
    ['Total de Agendamentos', totalAppointments, startDate.toISOString(), endDate.toISOString()].map(escapeCSV).join(','),
    ['Taxa de Sucesso (%)', bookingSuccessRate, startDate.toISOString(), endDate.toISOString()].map(escapeCSV).join(','),
    ['Taxa de Faltas (%)', noShowRate, startDate.toISOString(), endDate.toISOString()].map(escapeCSV).join(','),
    ['Taxa de Cancelamento (%)', cancellationRate, startDate.toISOString(), endDate.toISOString()].map(escapeCSV).join(','),
    ['Agendamentos Confirmados', appointmentCounts['confirmed'] || 0, startDate.toISOString(), endDate.toISOString()].map(escapeCSV).join(','),
    ['Agendamentos Concluidos', appointmentCounts['completed'] || 0, startDate.toISOString(), endDate.toISOString()].map(escapeCSV).join(','),
    ['Agendamentos Cancelados', appointmentCounts['cancelled'] || 0, startDate.toISOString(), endDate.toISOString()].map(escapeCSV).join(','),
    ['Agendamentos No-Show', appointmentCounts['no_show'] || 0, startDate.toISOString(), endDate.toISOString()].map(escapeCSV).join(','),
    ['Total de Alertas', totalAlerts, startDate.toISOString(), endDate.toISOString()].map(escapeCSV).join(','),
    ['Alertas Resolvidos', resolvedAlerts, startDate.toISOString(), endDate.toISOString()].map(escapeCSV).join(','),
    ['Alertas - Conversas Travadas', alertCounts['conversas_travadas'] || 0, startDate.toISOString(), endDate.toISOString()].map(escapeCSV).join(','),
    ['Alertas - Pre Check-ins Pendentes', alertCounts['pre_checkins_pendentes'] || 0, startDate.toISOString(), endDate.toISOString()].map(escapeCSV).join(','),
    ['Alertas - Agendamentos Nao Confirmados', alertCounts['agendamentos_nao_confirmados'] || 0, startDate.toISOString(), endDate.toISOString()].map(escapeCSV).join(','),
    ['Alertas - Handoff Normal', alertCounts['handoff_normal'] || 0, startDate.toISOString(), endDate.toISOString()].map(escapeCSV).join(','),
    ['Alertas - Handoff Erro', alertCounts['handoff_erro'] || 0, startDate.toISOString(), endDate.toISOString()].map(escapeCSV).join(','),
  ]

  return [header, ...rows].join('\n')
}

/**
 * Format date for filename (YYYY-MM-DD)
 */
function formatDateForFilename(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/**
 * Escape value for CSV
 * Handles commas, quotes, and newlines
 */
function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  const str = String(value)

  // If the value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}
