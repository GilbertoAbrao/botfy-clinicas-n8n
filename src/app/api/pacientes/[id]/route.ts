import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { checkPermission, PERMISSIONS } from '@/lib/rbac/permissions'
import { logAudit, AuditAction } from '@/lib/audit/logger'
import { patientSchema } from '@/lib/validations/patient'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const user = await getCurrentUserWithRole()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Authorization check - only ADMIN and ATENDENTE can view patient profiles
    if (user.role !== 'ADMIN' && user.role !== 'ATENDENTE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Await params (Next.js 15+ async params)
    const { id } = await params

    // Fetch patient with relations
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { scheduledAt: 'desc' },
        },
      },
    })

    // Return 404 if not found
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Log audit entries for PHI access
    // Fire-and-forget pattern - don't await to avoid blocking response
    logAudit({
      userId: user.id,
      action: AuditAction.VIEW_PATIENT,
      resource: 'patients',
      resourceId: patient.id,
    })

    if (patient.appointments.length > 0) {
      logAudit({
        userId: user.id,
        action: AuditAction.VIEW_APPOINTMENT,
        resource: 'appointments',
        resourceId: patient.id,
        details: {
          appointmentCount: patient.appointments.length,
        },
      })
    }

    // Return patient with relations
    return NextResponse.json(patient)
  } catch (error) {
    console.error('Error fetching patient:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const user = await getCurrentUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Authorization check (ADMIN or ATENDENTE)
    if (!checkPermission(user.role, PERMISSIONS.MANAGE_PATIENTS)) {
      return NextResponse.json(
        { error: 'Sem permissão para editar pacientes' },
        { status: 403 }
      )
    }

    // Await params
    const { id } = await params

    // Parse and validate request body
    const body = await request.json()
    const validation = patientSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Check if patient exists
    const existingPatient = await prisma.patient.findUnique({
      where: { id },
    })

    if (!existingPatient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      )
    }

    // Check CPF uniqueness if changed (exclude current patient)
    if (validatedData.cpf && validatedData.cpf !== '') {
      const cpfConflict = await prisma.patient.findFirst({
        where: {
          cpf: validatedData.cpf,
          id: { not: id },
        },
      })

      if (cpfConflict) {
        return NextResponse.json(
          { error: 'CPF já cadastrado em outro paciente' },
          { status: 409 }
        )
      }
    }

    // Track what changed for audit log
    const changes: Record<string, { from: any; to: any }> = {}

    if (existingPatient.nome !== validatedData.nome) {
      changes.nome = { from: existingPatient.nome, to: validatedData.nome }
    }
    if (existingPatient.telefone !== validatedData.telefone) {
      changes.telefone = {
        from: existingPatient.telefone,
        to: validatedData.telefone,
      }
    }
    if (existingPatient.email !== (validatedData.email || null)) {
      changes.email = {
        from: existingPatient.email,
        to: validatedData.email || null,
      }
    }
    if (existingPatient.cpf !== (validatedData.cpf || null)) {
      changes.cpf = { from: existingPatient.cpf, to: validatedData.cpf || null }
    }

    // Update patient
    const updatedPatient = await prisma.patient.update({
      where: { id },
      data: {
        nome: validatedData.nome,
        telefone: validatedData.telefone,
        email: validatedData.email || null,
        cpf: validatedData.cpf || null,
        dataNascimento: validatedData.dataNascimento
          ? new Date(validatedData.dataNascimento)
          : null,
        endereco: validatedData.endereco || null,
        convenio: validatedData.convenio || null,
        numeroCarteirinha: validatedData.numeroCarteirinha || null,
      },
    })

    // Get request headers for audit log
    const ipAddress = request.headers.get('x-forwarded-for') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    // Log audit entry with changed fields
    await logAudit({
      userId: user.id,
      action: AuditAction.UPDATE_PATIENT,
      resource: 'patients',
      resourceId: updatedPatient.id,
      details: {
        patientName: updatedPatient.nome,
        changes,
      },
      ipAddress,
      userAgent,
    })

    // Return updated patient
    return NextResponse.json(updatedPatient)
  } catch (error) {
    console.error('Error updating patient:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar paciente' },
      { status: 500 }
    )
  }
}
