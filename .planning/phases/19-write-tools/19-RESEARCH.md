# Phase 19: Write Tools (Create/Update Operations) - Research

**Researched:** 2026-01-24
**Domain:** Next.js API Routes, Prisma Transactions, Idempotency, Conflict Detection
**Confidence:** HIGH

## Summary

Phase 19 implements 5 write endpoints for the AI Agent to create, reschedule, cancel appointments, update patient data, and confirm attendance. The research reveals that:

1. **Existing conflict detection logic is available** in `src/lib/calendar/conflict-detection.ts` from Phase 4 - reuse `findConflicts()` and `isSlotAvailable()` functions
2. **Console UI routes already implement the core patterns** for appointment creation/updates with conflict checking and N8N webhook notifications
3. **Idempotency for create operations** should use a simple database-stored key approach with TTL, NOT complex distributed caching
4. **Prisma transactions** support atomic operations for create-with-lookup scenarios (e.g., creating appointment with patient verification)
5. **Waitlist notification** is already implemented in `src/lib/waitlist/auto-fill.ts` - reuse for cancellation flows
6. **Status confirmation** is trivial - single field update with validation against allowed transitions

**Primary recommendation:** Extract existing Console UI patterns into service functions in `/src/lib/services/`, add idempotency key support via a new `idempotency_keys` table, and reuse Phase 4 conflict detection. All write operations should use the same `withAgentAuth()` HOF and `successResponse()`/`errorResponse()` patterns from Phase 18.

## Standard Stack

### Core Dependencies (Already Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | Latest | ORM with transactions | Type-safe writes, atomic operations, already in use |
| Zod | Latest | Request validation | Runtime type safety, schemas already defined in Phase 17 |
| @date-fns/tz | Latest | Timezone-aware dates | Brazil DST handling for appointment scheduling |
| bcrypt | Latest | API key validation | Used by Phase 17 agent auth |
| uuid | Latest | Idempotency key generation | Client-side key generation for retry safety |

### Supporting Libraries (Already Available)

| Library | Purpose | When to Use |
|---------|---------|-------------|
| `@/lib/calendar/conflict-detection` | Slot overlap detection | All appointment create/update operations |
| `@/lib/calendar/availability-calculator` | Slot availability | Validate proposed times before booking |
| `@/lib/waitlist/auto-fill` | Waitlist notification | Trigger after appointment cancellation |
| `@/lib/calendar/n8n-sync` | N8N webhooks | Notify N8N of appointment changes |
| `@/lib/agent/middleware` | Agent authentication | Wrap all agent API handlers |
| `@/lib/agent/error-handler` | Error responses | Consistent error format |

### No New Dependencies Required

All necessary libraries are already installed. The only addition is a new Prisma model for idempotency keys.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   └── api/
│       └── agent/
│           ├── agendamentos/
│           │   ├── route.ts           # GET (existing) + POST (new)
│           │   └── [id]/
│           │       ├── route.ts       # PATCH (reschedule), DELETE (cancel)
│           │       └── confirmar/
│           │           └── route.ts   # POST (confirm attendance)
│           └── paciente/
│               └── [id]/
│                   └── route.ts       # PATCH (update patient)
├── lib/
│   ├── services/
│   │   ├── appointment-write-service.ts  # Create, reschedule, cancel, confirm
│   │   └── patient-write-service.ts      # Update patient data
│   ├── idempotency/
│   │   └── idempotency-service.ts        # Key storage and validation
│   ├── calendar/                         # Existing - reuse
│   │   ├── conflict-detection.ts
│   │   └── availability-calculator.ts
│   └── waitlist/                         # Existing - reuse
│       └── auto-fill.ts
```

### Pattern 1: Idempotency Key Storage

**What:** Store idempotency keys in database with request hash and response, using TTL for cleanup.

**When to use:** POST operations that must not be duplicated (appointment creation).

**Example:**

```typescript
// src/lib/idempotency/idempotency-service.ts
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

const TTL_HOURS = 24 // Keys expire after 24 hours

export interface IdempotencyResult {
  isNew: boolean
  storedResponse?: unknown
}

export async function checkIdempotencyKey(
  key: string,
  requestHash: string
): Promise<IdempotencyResult> {
  const existing = await prisma.idempotencyKey.findUnique({
    where: { key },
  })

  if (!existing) {
    return { isNew: true }
  }

  // Check if request body matches (prevent key reuse with different payload)
  if (existing.requestHash !== requestHash) {
    throw new Error('Idempotency key reused with different request body')
  }

  // Return cached response
  return {
    isNew: false,
    storedResponse: existing.response,
  }
}

export async function storeIdempotencyResult(
  key: string,
  requestHash: string,
  response: unknown
): Promise<void> {
  await prisma.idempotencyKey.create({
    data: {
      key,
      requestHash,
      response: response as any,
      expiresAt: new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000),
    },
  })
}

export function hashRequestBody(body: unknown): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(body))
    .digest('hex')
}

// Cleanup job (can be run via cron)
export async function cleanupExpiredKeys(): Promise<number> {
  const result = await prisma.idempotencyKey.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  })
  return result.count
}
```

**Source:** [Zuplo - Implementing Idempotency Keys in REST APIs](https://zuplo.com/learning-center/implementing-idempotency-keys-in-rest-apis-a-complete-guide)

### Pattern 2: Appointment Creation with Conflict Detection

**What:** Create appointment only after verifying no time conflicts exist.

**When to use:** POST /api/agent/agendamentos

**Example:**

```typescript
// src/lib/services/appointment-write-service.ts
import { prisma } from '@/lib/prisma'
import { findConflicts, addBufferTime, TimeSlot } from '@/lib/calendar/conflict-detection'
import { notifyN8NAppointmentCreated } from '@/lib/calendar/n8n-sync'
import { TZDate } from '@date-fns/tz'

export interface CreateAppointmentInput {
  pacienteId: number
  servicoId?: number
  tipoConsulta?: string
  profissional?: string
  dataHora: TZDate
  observacoes?: string
  idempotencyKey?: string
}

export async function createAppointment(
  input: CreateAppointmentInput,
  agentContext: { userId: string; agentId: string }
) {
  // 1. Validate patient exists
  const patient = await prisma.patient.findUnique({
    where: { id: input.pacienteId },
    select: { id: true, nome: true, telefone: true },
  })

  if (!patient) {
    throw new Error('Patient not found')
  }

  // 2. Get service duration (default 30 min)
  let duration = 30
  let tipoConsulta = input.tipoConsulta || 'Consulta'

  if (input.servicoId) {
    const servico = await prisma.servico.findUnique({
      where: { id: input.servicoId },
      select: { nome: true, duracaoMinutos: true },
    })
    if (servico) {
      duration = servico.duracaoMinutos
      tipoConsulta = servico.nome
    }
  }

  // 3. Create proposed time slot
  const startTime = new Date(input.dataHora)
  const endTime = new Date(startTime.getTime() + duration * 60000)
  const providerId = input.profissional || 'default'

  const proposedSlot: TimeSlot = {
    providerId,
    start: startTime,
    end: endTime,
  }

  // 4. Add buffer time (15 min)
  const slotWithBuffer = addBufferTime(proposedSlot, 15)

  // 5. Fetch existing appointments for conflict check
  const dayStart = new Date(startTime)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(startTime)
  dayEnd.setHours(23, 59, 59, 999)

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      dataHora: { gte: dayStart, lte: dayEnd },
      profissional: providerId,
      status: { notIn: ['cancelada', 'faltou'] },
    },
    select: {
      id: true,
      dataHora: true,
      duracaoMinutos: true,
      profissional: true,
    },
  })

  // 6. Convert to TimeSlot format
  const existingSlots: TimeSlot[] = existingAppointments.map((apt) => ({
    id: apt.id.toString(),
    providerId: apt.profissional || 'default',
    start: new Date(apt.dataHora),
    end: new Date(apt.dataHora.getTime() + (apt.duracaoMinutos || 30) * 60000),
  }))

  // 7. Check for conflicts
  const conflicts = findConflicts(slotWithBuffer, existingSlots)

  if (conflicts.length > 0) {
    throw new Error('Time slot already booked')
  }

  // 8. Create appointment
  const appointment = await prisma.appointment.create({
    data: {
      pacienteId: input.pacienteId,
      servicoId: input.servicoId,
      tipoConsulta,
      profissional: input.profissional,
      dataHora: input.dataHora,
      duracaoMinutos: duration,
      status: 'agendada',
      observacoes: input.observacoes,
    },
    include: {
      paciente: { select: { nome: true, telefone: true } },
    },
  })

  // 9. Trigger N8N webhook (async, don't block)
  notifyN8NAppointmentCreated({
    appointmentId: appointment.id.toString(),
    patientId: appointment.pacienteId.toString(),
    serviceId: input.servicoId?.toString() || tipoConsulta,
    providerId: input.profissional || 'default',
    dataHora: appointment.dataHora.toISOString(),
    status: appointment.status || 'agendada',
    patientName: appointment.paciente.nome,
    patientPhone: appointment.paciente.telefone,
    serviceName: tipoConsulta,
    providerName: input.profissional,
  }).catch((err) => console.error('N8N sync failed:', err))

  return appointment
}
```

**Source:** Existing Console UI implementation (`src/app/api/agendamentos/route.ts`)

### Pattern 3: Prisma Interactive Transaction for Atomic Operations

**What:** Use `prisma.$transaction()` for operations that need read-then-write atomicity.

**When to use:** When you need to read data, make a decision, and write atomically.

**Example:**

```typescript
// Reschedule with atomic conflict check
export async function rescheduleAppointment(
  appointmentId: number,
  newDataHora: TZDate
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch existing appointment (with lock)
    const existing = await tx.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        dataHora: true,
        duracaoMinutos: true,
        profissional: true,
        status: true,
      },
    })

    if (!existing) {
      throw new Error('Appointment not found')
    }

    if (existing.status === 'cancelada') {
      throw new Error('Cannot reschedule cancelled appointment')
    }

    // 2. Check conflicts for new time (within transaction)
    const duration = existing.duracaoMinutos || 30
    const newStart = new Date(newDataHora)
    const newEnd = new Date(newStart.getTime() + duration * 60000)
    const providerId = existing.profissional || 'default'

    const dayStart = new Date(newStart)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(newStart)
    dayEnd.setHours(23, 59, 59, 999)

    const conflictingAppointments = await tx.appointment.findMany({
      where: {
        id: { not: appointmentId }, // Exclude self
        profissional: providerId,
        dataHora: { gte: dayStart, lte: dayEnd },
        status: { notIn: ['cancelada', 'faltou'] },
      },
    })

    // Check for overlap
    for (const apt of conflictingAppointments) {
      const aptStart = new Date(apt.dataHora)
      const aptEnd = new Date(aptStart.getTime() + (apt.duracaoMinutos || 30) * 60000)

      // Add 15 min buffer
      const bufferedEnd = new Date(newEnd.getTime() + 15 * 60000)

      if (newStart < aptEnd && aptStart < bufferedEnd) {
        throw new Error('Time slot already booked')
      }
    }

    // 3. Update appointment
    return await tx.appointment.update({
      where: { id: appointmentId },
      data: { dataHora: newDataHora },
      include: {
        paciente: { select: { nome: true, telefone: true } },
      },
    })
  })
}
```

**Source:** [Prisma Documentation - Transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)

### Pattern 4: Cancel with Reason and Waitlist Trigger

**What:** Update appointment status to cancelled, store reason, and trigger waitlist notification.

**When to use:** DELETE /api/agent/agendamentos/:id

**Example:**

```typescript
// src/lib/services/appointment-write-service.ts
import { notifyWaitlist } from '@/lib/waitlist/auto-fill'
import { notifyN8NAppointmentCancelled } from '@/lib/calendar/n8n-sync'

export async function cancelAppointment(
  appointmentId: number,
  motivo: string
) {
  // 1. Fetch appointment before update
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      paciente: { select: { id: true, nome: true, telefone: true } },
    },
  })

  if (!appointment) {
    throw new Error('Appointment not found')
  }

  if (appointment.status === 'cancelada') {
    // Already cancelled - idempotent return
    return { ...appointment, alreadyCancelled: true }
  }

  // 2. Update status to cancelled with reason
  const cancelled = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: 'cancelada',
      observacoes: appointment.observacoes
        ? `${appointment.observacoes}\n\nMotivo cancelamento: ${motivo}`
        : `Motivo cancelamento: ${motivo}`,
    },
    include: {
      paciente: { select: { nome: true, telefone: true } },
    },
  })

  // 3. Trigger N8N webhook (async)
  notifyN8NAppointmentCancelled({
    appointmentId: appointmentId.toString(),
    patientId: appointment.paciente.id.toString(),
    serviceId: appointment.tipoConsulta,
    providerId: appointment.profissional || 'default',
    dataHora: appointment.dataHora.toISOString(),
    status: 'cancelada',
    patientName: appointment.paciente.nome,
    patientPhone: appointment.paciente.telefone,
    serviceName: appointment.tipoConsulta,
    providerName: appointment.profissional,
  }).catch((err) => console.error('N8N sync failed:', err))

  // 4. Trigger waitlist notification (async)
  notifyWaitlist({
    servicoTipo: appointment.tipoConsulta,
    providerId: appointment.profissional,
    dataHora: appointment.dataHora,
  }).catch((err) => console.error('Waitlist notification failed:', err))

  return cancelled
}
```

**Source:** Existing Console UI implementation (`src/app/api/agendamentos/[id]/route.ts`)

### Pattern 5: Status Confirmation (Simple State Transition)

**What:** Update appointment status to "confirmado" or "presente" with validation.

**When to use:** POST /api/agent/agendamentos/:id/confirmar

**Example:**

```typescript
// src/lib/services/appointment-write-service.ts
export async function confirmAppointment(
  appointmentId: number,
  tipo: 'confirmado' | 'presente'
) {
  // 1. Fetch current appointment
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, status: true },
  })

  if (!appointment) {
    throw new Error('Appointment not found')
  }

  // 2. Validate state transition
  const invalidStates = ['cancelada', 'faltou', 'realizada']
  if (invalidStates.includes(appointment.status || '')) {
    throw new Error(`Cannot confirm appointment with status: ${appointment.status}`)
  }

  // "presente" can only be set if already "confirmado"
  if (tipo === 'presente' && appointment.status !== 'confirmado') {
    throw new Error('Appointment must be confirmed before marking as present')
  }

  // 3. Update status
  return await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: tipo },
    include: {
      paciente: { select: { nome: true, telefone: true } },
    },
  })
}
```

### Pattern 6: Partial Patient Update

**What:** Update only provided fields using Prisma's built-in partial update support.

**When to use:** PATCH /api/agent/paciente/:id

**Example:**

```typescript
// src/lib/services/patient-write-service.ts
import { prisma } from '@/lib/prisma'

export interface UpdatePatientInput {
  nome?: string
  telefone?: string
  email?: string
  cpf?: string
  dataNascimento?: Date
  convenio?: string
  observacoes?: string
}

export async function updatePatient(
  patientId: number,
  input: UpdatePatientInput
) {
  // 1. Verify patient exists
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  })

  if (!patient) {
    throw new Error('Patient not found')
  }

  // 2. If updating phone, check for duplicates
  if (input.telefone && input.telefone !== patient.telefone) {
    const existing = await prisma.patient.findUnique({
      where: { telefone: input.telefone },
    })
    if (existing) {
      throw new Error('Phone number already in use by another patient')
    }
  }

  // 3. Build update data (only non-undefined fields)
  const updateData: Partial<UpdatePatientInput> = {}
  if (input.nome !== undefined) updateData.nome = input.nome
  if (input.telefone !== undefined) updateData.telefone = input.telefone
  if (input.email !== undefined) updateData.email = input.email
  if (input.cpf !== undefined) updateData.cpf = input.cpf
  if (input.dataNascimento !== undefined) updateData.dataNascimento = input.dataNascimento
  if (input.convenio !== undefined) updateData.convenio = input.convenio
  if (input.observacoes !== undefined) updateData.observacoes = input.observacoes

  // 4. Update patient
  return await prisma.patient.update({
    where: { id: patientId },
    data: updateData,
  })
}
```

### Anti-Patterns to Avoid

- **Using DELETE HTTP method for cancellation with reason:** Use status update (soft delete) instead of hard delete to preserve audit trail
- **Skipping conflict detection for updates:** Always check conflicts when dataHora changes
- **Blocking on N8N webhook failures:** Always fire-and-forget with `.catch(console.error)`
- **Creating idempotency without request hash:** Prevents key reuse with different payloads
- **Multiple concurrent writes without transaction:** Use `$transaction()` for read-then-write patterns

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Conflict detection | Manual date overlap checking | `findConflicts()` from Phase 4 | Already handles buffer time, provider isolation, self-exclusion |
| Waitlist notification | Custom queue/notification | `notifyWaitlist()` from `auto-fill.ts` | Already queries waitlist, calls N8N webhook |
| N8N webhook calls | Raw fetch with custom error handling | `notifyN8N*()` from `n8n-sync.ts` | Handles missing config, non-blocking errors |
| Idempotency storage | In-memory cache or Redis | Database table with TTL | Survives restarts, simple cleanup cron |
| Date validation | Manual ISO parsing | `flexibleDateTimeSchema` from Phase 17 | DST-aware, handles 4 formats |
| API response format | Custom JSON structure | `successResponse()`/`errorResponse()` | Consistent with Phase 17-18 |

**Key insight:** Phase 4 calendar utilities and existing Console UI routes already solve 80% of the write operation complexity. Extract and reuse, don't reinvent.

## Common Pitfalls

### Pitfall 1: Race Condition in Conflict Detection

**What goes wrong:** Two concurrent requests book the same slot because conflict check and insert are not atomic.

**Why it happens:** Prisma `findMany()` + `create()` are separate operations; another request can insert between them.

**How to avoid:**
- Use Prisma `$transaction()` for the entire check-and-insert flow
- Or add database unique constraint on (profissional, dataHora) with partial index excluding cancelled
- Consider using Prisma's `createMany()` with `skipDuplicates` for batch operations

**Warning signs:**
- Double bookings appearing in production logs
- "Conflict detected" errors returned after successful creation
- Users reporting they booked at the same time as someone else

**Example fix:**
```typescript
// Wrap in transaction to prevent race condition
await prisma.$transaction(async (tx) => {
  const conflicts = await tx.appointment.findMany({ where: conflictQuery })
  if (conflicts.length > 0) throw new Error('Time slot already booked')
  return await tx.appointment.create({ data: appointmentData })
})
```

### Pitfall 2: Idempotency Key Without Request Body Hash

**What goes wrong:** Client reuses idempotency key with different appointment data, server returns cached response for wrong appointment.

**Why it happens:** Only checking if key exists, not if request payload matches.

**How to avoid:**
- Hash the request body and store alongside idempotency key
- Compare hashes on cache hit
- Return 422 (Unprocessable Entity) if key reused with different body

**Warning signs:**
- Appointments created with wrong data on retry
- Client confusion about which appointment was actually created
- Duplicate idempotency keys in logs with different payloads

**Example fix:**
```typescript
const requestHash = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')
const existing = await prisma.idempotencyKey.findUnique({ where: { key } })
if (existing && existing.requestHash !== requestHash) {
  throw new Error('Idempotency key reused with different request body')
}
```

### Pitfall 3: Blocking on N8N Webhook Failures

**What goes wrong:** Appointment creation fails or times out because N8N webhook is slow or down.

**Why it happens:** Awaiting webhook response in the critical path.

**How to avoid:**
- Fire-and-forget pattern: call webhook without await
- Log errors but don't throw
- Use `.catch(console.error)` to prevent unhandled rejections

**Warning signs:**
- Appointment creation timeouts correlate with N8N downtime
- Long response times (>5s) for appointment APIs
- Users reporting "failed" appointments that actually succeeded

**Correct pattern:**
```typescript
// GOOD: Fire and forget
notifyN8NAppointmentCreated(payload).catch(err => console.error('N8N sync failed:', err))
return successResponse(appointment, 201)

// BAD: Blocking
await notifyN8NAppointmentCreated(payload) // <-- Can fail/timeout
return successResponse(appointment, 201)
```

### Pitfall 4: Inconsistent Status Transitions

**What goes wrong:** Appointment marked as "presente" without being "confirmado" first, or cancelled appointment gets confirmed.

**Why it happens:** No state machine validation in update logic.

**How to avoid:**
- Define valid state transitions explicitly
- Validate current status before allowing transition
- Return descriptive error message for invalid transitions

**Valid transitions:**
```
agendada → confirmado → presente → realizada
agendada → cancelada
agendada → faltou (only after appointment time passed)
confirmado → cancelada
confirmado → faltou (only after appointment time passed)
```

**Warning signs:**
- Appointments with impossible status sequences in audit log
- Cancelled appointments appearing in "confirmed" reports
- Business logic bugs from invalid states

### Pitfall 5: Forgetting Waitlist Notification on Cancel

**What goes wrong:** Appointment cancelled but waitlist patients not notified of available slot.

**Why it happens:** Waitlist logic not called in cancellation flow.

**How to avoid:**
- Always call `notifyWaitlist()` after status changes to 'cancelada'
- Use fire-and-forget pattern (don't block cancellation)
- Log success/failure for debugging

**Warning signs:**
- Waitlist patients complaining they weren't notified
- Empty slots going unfilled despite active waitlist
- `notifyWaitlist` never appearing in logs after cancellations

## Code Examples

### Example 1: POST /api/agent/agendamentos with Idempotency

```typescript
// src/app/api/agent/agendamentos/route.ts
import { NextRequest } from 'next/server'
import { withAgentAuth } from '@/lib/agent/middleware'
import { successResponse, handleApiError, errorResponse } from '@/lib/agent/error-handler'
import { createAppointment } from '@/lib/services/appointment-write-service'
import { checkIdempotencyKey, storeIdempotencyResult, hashRequestBody } from '@/lib/idempotency/idempotency-service'
import { agentCreateAppointmentSchema } from '@/lib/validations/agent-schemas'
import { logAudit, AuditAction } from '@/lib/audit/logger'

export const POST = withAgentAuth(async (req: NextRequest, context, agentContext) => {
  try {
    // 1. Parse and validate request body
    const body = await req.json()
    const input = agentCreateAppointmentSchema.parse(body)

    // 2. Check idempotency key if provided
    if (input.idempotencyKey) {
      const requestHash = hashRequestBody(body)
      const idempotencyCheck = await checkIdempotencyKey(input.idempotencyKey, requestHash)

      if (!idempotencyCheck.isNew) {
        // Return cached response
        return successResponse(idempotencyCheck.storedResponse)
      }
    }

    // 3. Create appointment
    const appointment = await createAppointment(input, {
      userId: agentContext.userId,
      agentId: agentContext.agentId,
    })

    // 4. Format response
    const response = {
      id: appointment.id,
      dataHora: appointment.dataHora.toISOString(),
      tipoConsulta: appointment.tipoConsulta,
      profissional: appointment.profissional,
      status: appointment.status,
      paciente: {
        id: appointment.pacienteId,
        nome: appointment.paciente.nome,
        telefone: appointment.paciente.telefone,
      },
    }

    // 5. Store idempotency result if key was provided
    if (input.idempotencyKey) {
      await storeIdempotencyResult(
        input.idempotencyKey,
        hashRequestBody(body),
        response
      )
    }

    // 6. Audit log
    logAudit({
      userId: agentContext.userId,
      action: AuditAction.AGENT_CREATE_APPOINTMENT,
      resource: 'agent_api',
      resourceId: appointment.id.toString(),
      details: {
        agentId: agentContext.agentId,
        correlationId: agentContext.correlationId,
        pacienteId: input.pacienteId,
        dataHora: input.dataHora.toISOString(),
        idempotencyKey: input.idempotencyKey ? '***' : undefined,
      },
    }).catch(console.error)

    // 7. Return success
    return successResponse(response, 201)
  } catch (error) {
    if (error instanceof Error && error.message === 'Time slot already booked') {
      return errorResponse('Horario ja ocupado', 409)
    }
    return handleApiError(error)
  }
})
```

### Example 2: PATCH /api/agent/agendamentos/:id (Reschedule)

```typescript
// src/app/api/agent/agendamentos/[id]/route.ts
import { NextRequest } from 'next/server'
import { withAgentAuth } from '@/lib/agent/middleware'
import { successResponse, handleApiError, errorResponse } from '@/lib/agent/error-handler'
import { rescheduleAppointment } from '@/lib/services/appointment-write-service'
import { agentUpdateAppointmentSchema } from '@/lib/validations/agent-schemas'
import { logAudit, AuditAction } from '@/lib/audit/logger'

export const PATCH = withAgentAuth(async (
  req: NextRequest,
  context,
  agentContext
) => {
  try {
    // 1. Get appointment ID from route params
    const appointmentId = parseInt(context.params?.id || '', 10)
    if (isNaN(appointmentId)) {
      return errorResponse('Invalid appointment ID', 400)
    }

    // 2. Parse and validate request body
    const body = await req.json()
    const input = agentUpdateAppointmentSchema.parse(body)

    // 3. Reschedule appointment
    const appointment = await rescheduleAppointment(appointmentId, input)

    // 4. Format response
    const response = {
      id: appointment.id,
      dataHora: appointment.dataHora.toISOString(),
      tipoConsulta: appointment.tipoConsulta,
      profissional: appointment.profissional,
      status: appointment.status,
      paciente: {
        id: appointment.pacienteId,
        nome: appointment.paciente.nome,
        telefone: appointment.paciente.telefone,
      },
    }

    // 5. Audit log
    logAudit({
      userId: agentContext.userId,
      action: AuditAction.AGENT_UPDATE_APPOINTMENT,
      resource: 'agent_api',
      resourceId: appointment.id.toString(),
      details: {
        agentId: agentContext.agentId,
        correlationId: agentContext.correlationId,
        changes: {
          dataHora: input.dataHora ? 'updated' : undefined,
          profissional: input.profissional ? 'updated' : undefined,
        },
      },
    }).catch(console.error)

    return successResponse(response)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Appointment not found') {
        return errorResponse('Agendamento nao encontrado', 404)
      }
      if (error.message === 'Time slot already booked') {
        return errorResponse('Horario ja ocupado', 409)
      }
    }
    return handleApiError(error)
  }
})
```

### Example 3: DELETE /api/agent/agendamentos/:id (Cancel with Reason)

```typescript
// src/app/api/agent/agendamentos/[id]/route.ts (continued)
import { cancelAppointment } from '@/lib/services/appointment-write-service'
import { agentCancelAppointmentSchema } from '@/lib/validations/agent-schemas'

export const DELETE = withAgentAuth(async (
  req: NextRequest,
  context,
  agentContext
) => {
  try {
    // 1. Get appointment ID
    const appointmentId = parseInt(context.params?.id || '', 10)
    if (isNaN(appointmentId)) {
      return errorResponse('Invalid appointment ID', 400)
    }

    // 2. Parse and validate request body (reason required)
    const body = await req.json()
    const input = agentCancelAppointmentSchema.parse(body)

    // 3. Cancel appointment
    const result = await cancelAppointment(appointmentId, input.motivo)

    // 4. Audit log
    logAudit({
      userId: agentContext.userId,
      action: AuditAction.AGENT_CANCEL_APPOINTMENT,
      resource: 'agent_api',
      resourceId: appointmentId.toString(),
      details: {
        agentId: agentContext.agentId,
        correlationId: agentContext.correlationId,
        motivo: input.motivo.substring(0, 50), // Truncate in audit
        alreadyCancelled: result.alreadyCancelled || false,
      },
    }).catch(console.error)

    return successResponse({
      message: result.alreadyCancelled
        ? 'Agendamento ja estava cancelado'
        : 'Agendamento cancelado com sucesso',
      id: appointmentId,
      status: 'cancelada',
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Appointment not found') {
      return errorResponse('Agendamento nao encontrado', 404)
    }
    return handleApiError(error)
  }
})
```

### Example 4: Prisma Migration for Idempotency Keys

```prisma
// prisma/schema.prisma (add to existing schema)

// Idempotency key storage for agent API
// Keys expire after 24 hours to prevent unbounded growth
model IdempotencyKey {
  id          String   @id @default(uuid()) @db.Uuid
  key         String   @unique               // Client-provided UUID
  requestHash String   @map("request_hash")  // SHA-256 of request body
  response    Json     @db.JsonB             // Cached response
  createdAt   DateTime @default(now()) @map("created_at")
  expiresAt   DateTime @map("expires_at")    // TTL for cleanup

  @@index([expiresAt])
  @@map("idempotency_keys")
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hard delete for cancellation | Soft delete (status = 'cancelada') | 2024+ | Preserves audit trail, enables undo |
| Redis for idempotency | Database table with TTL | 2024+ | Simpler ops, survives restarts |
| Supabase RPC for transactions | Prisma `$transaction()` | Phase 17 | Type safety, better DX |
| Manual conflict loops | `findConflicts()` utility | Phase 4 | Already handles edge cases |
| `provider_id` UUID | `profissional` string | N8N legacy | Matches existing data model |

**Deprecated/outdated:**
- **Supabase nodes in N8N workflows:** Being migrated to Agent API (this phase)
- **Hard DELETE for appointments:** Use status update for HIPAA audit compliance
- **In-memory idempotency:** Doesn't survive restarts, not suitable for production

## Open Questions

### Question 1: Should we use database-level constraints for conflict prevention?

**What we know:**
- Application-level conflict detection exists (`findConflicts()`)
- Prisma transactions can prevent race conditions
- Database constraint would be absolute guarantee

**What's unclear:**
- Performance impact of partial index on (profissional, dataHora)
- How to handle the constraint violation error gracefully

**Recommendation:**
- **Start with transaction-based conflict detection** (already works)
- Add database constraint as a safety net in Phase 21 (production deployment)
- Constraint can be: `UNIQUE (profissional, dataHora) WHERE status NOT IN ('cancelada', 'faltou')`

### Question 2: Should idempotency keys be agent-scoped or global?

**What we know:**
- Current design uses global keys (any agent can reuse)
- Agent-scoped would require composite key (agent_id + key)
- N8N workflows likely generate keys per-request, not per-agent

**What's unclear:**
- Will multiple N8N agents share the same console instance?
- Risk of key collision between agents

**Recommendation:**
- **Use global keys** (simpler, matches Stripe's pattern)
- Client (N8N) is responsible for generating unique UUIDs
- 24-hour TTL prevents long-term collision issues

### Question 3: How to handle N8N webhook failures gracefully?

**What we know:**
- Webhooks should be fire-and-forget (don't block main operation)
- Failed webhooks mean reminders won't be scheduled
- Existing code uses `.catch(console.error)`

**What's unclear:**
- Should we retry failed webhooks?
- How to alert on persistent webhook failures?

**Recommendation:**
- **Keep fire-and-forget for Phase 19** (matches existing pattern)
- Log failures with structured logging for monitoring
- Consider retry queue in Phase 21 if failures become common
- Add health check in Phase 22 (MCP Server) that verifies N8N connectivity

## Sources

### Primary (HIGH confidence)

- **Existing codebase** - Phase 4 conflict detection, Phase 17-18 agent infrastructure, Console UI routes
- [Prisma Documentation - Transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions) - Interactive transactions, nested writes
- [Zuplo - Implementing Idempotency Keys](https://zuplo.com/learning-center/implementing-idempotency-keys-in-rest-apis-a-complete-guide) - Key storage, request hashing, TTL

### Secondary (MEDIUM confidence)

- [Medusa - Idempotency in NodeJS](https://medusajs.com/blog/idempotency-nodejs-express-open-source/) - State machine pattern, implementation details
- [DEV Community - Idempotent APIs](https://dev.to/karishmashukla/building-resilient-systems-with-idempotent-apis-5e5p) - Best practices, error handling

### Tertiary (LOW confidence)

- [MDN - Idempotent Glossary](https://developer.mozilla.org/en-US/docs/Glossary/Idempotent) - HTTP method semantics
- [RESTful API - Idempotent REST APIs](https://restfulapi.net/idempotent-rest-apis/) - DELETE vs PUT for cancel

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already installed, patterns proven in Console UI
- Architecture: HIGH - Service layer pattern matches Phase 18, conflict detection from Phase 4
- Idempotency: MEDIUM - Pattern verified via web research, implementation is straightforward
- Transactions: HIGH - Prisma documentation verified, existing usage in codebase
- Pitfalls: HIGH - Based on existing Console UI bugs and fixes

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable domain, patterns well-established)

## Key Takeaways for Planning

1. **Reuse existing logic:** Phase 4 `findConflicts()`, Console UI webhook patterns, Phase 17 schemas
2. **Add idempotency table:** Simple Prisma model with TTL, no Redis needed
3. **Use transactions for race safety:** Wrap conflict check + create in `$transaction()`
4. **Fire-and-forget for webhooks:** Never block on N8N, always `.catch(console.error)`
5. **Soft delete for cancel:** Update status, store reason, trigger waitlist
6. **Validate state transitions:** Don't allow "presente" without "confirmado" first
7. **Partial updates for patient:** Only update fields that are provided in request
