# Phase 15: Procedure Instructions CRUD - Research

**Researched:** 2026-01-21
**Domain:** Admin CRUD interface for procedure instructions with WhatsApp preview
**Confidence:** HIGH

## Summary

Phase 15 implements a standalone CRUD interface for managing procedure instructions stored in the `instrucoes_procedimentos` table. These instructions are sent to patients via WhatsApp by N8N workflows. The phase is primarily a frontend admin feature with API routes, following established patterns already present in the codebase (e.g., Services CRUD, Pre-Checkin Dashboard).

The database table already exists with a well-defined schema including: `servico_id`, `tipo_instrucao`, `titulo`, `conteudo`, `prioridade`, and `ativo` fields. The instruction types are constrained to 7 predefined values: preparo, jejum, medicamentos, vestuario, acompanhante, documentos, geral.

The unique feature is the WhatsApp message preview component, which must display a realistic chat bubble showing how the instruction will appear when sent to patients. This follows decisions from CONTEXT.md: live preview, sample data with Brazilian names/dates, green bubble styling, and long message warnings.

**Primary recommendation:** Follow existing Services CRUD patterns exactly (page structure, form modal, table, API routes), adding Prisma model for `instrucoes_procedimentos` and a WhatsApp preview component using CSS chat bubbles.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Codebase)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 14+ | Framework | Already used throughout project |
| React Hook Form | latest | Form handling | Already used in ServiceFormModal, UserFormModal |
| Zod | latest | Validation | Already used for all form validation |
| Prisma | latest | ORM | Already used for all database access |
| shadcn/ui | latest | UI components | Already used (Dialog, Table, Input, etc.) |
| sonner | latest | Toast notifications | Already used throughout codebase |
| Tailwind CSS | latest | Styling | Already used for all components |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | latest | Icons | Already used for all icons |
| date-fns | latest | Date formatting | For preview sample data dates |

### No New Libraries Required
All required functionality can be achieved with existing dependencies. The WhatsApp preview is pure CSS + Tailwind.

**Installation:**
No new packages needed. Only Prisma schema update required.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── admin/
│   │   └── pre-checkin/
│   │       └── instrucoes/
│   │           └── page.tsx             # Admin page (INST-09)
│   └── api/
│       └── procedures/
│           └── instructions/
│               ├── route.ts             # GET list, POST create
│               └── [id]/
│                   └── route.ts         # GET one, PUT update, PATCH deactivate
├── components/
│   └── instructions/
│       ├── instructions-page-client.tsx # Main container component
│       ├── instruction-table.tsx        # Table display
│       ├── instruction-form-modal.tsx   # Create/Edit modal
│       ├── instruction-search.tsx       # Search + filters
│       ├── whatsapp-preview.tsx         # Live preview component
│       └── instruction-type-badge.tsx   # Type badge with icons
├── hooks/
│   └── use-instructions.ts              # Data fetching hook
├── lib/
│   └── validations/
│       └── instruction.ts               # Zod schema + types
└── prisma/
    └── schema.prisma                    # Add ProcedureInstruction model
```

### Pattern 1: Admin CRUD Page (Follow Services Pattern)
**What:** Server component page with client component for interactive features
**When to use:** All admin management pages
**Example:**
```typescript
// src/app/admin/pre-checkin/instrucoes/page.tsx
// Source: Existing pattern from src/app/admin/servicos/page.tsx
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InstructionsPageClient } from '@/components/instructions/instructions-page-client';

export default async function InstrucoesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/pre-checkin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Pre-Checkin
          </Button>
        </Link>
      </div>
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Instrucoes de Procedimentos</h1>
        <p className="text-gray-600 mt-1">Gerencie as instrucoes enviadas aos pacientes</p>
      </div>
      <Suspense fallback={<TableSkeleton />}>
        <InstructionsPageClient {...params} />
      </Suspense>
    </div>
  );
}
```

### Pattern 2: Form Modal with Validation (Follow Services Pattern)
**What:** Dialog-based form using react-hook-form + zod
**When to use:** Create/Edit operations
**Example:**
```typescript
// Source: Existing pattern from src/components/services/service-form-modal.tsx
const {
  register,
  handleSubmit,
  reset,
  setValue,
  watch,
  formState: { errors },
} = useForm<InstructionInput>({
  resolver: zodResolver(instructionSchema),
  defaultValues: {
    titulo: '',
    conteudo: '',
    tipo_instrucao: 'geral',
    prioridade: 0,
    ativo: true,
  },
});
```

### Pattern 3: API Route with Auth + RBAC (Follow Services Pattern)
**What:** Route handler with authentication, authorization, audit logging
**When to use:** All API routes
**Example:**
```typescript
// Source: Existing pattern from src/app/api/servicos/route.ts
export async function GET(request: NextRequest) {
  const user = await getCurrentUserWithRole();
  if (!user) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
  }
  if (!checkPermission(user.role, PERMISSIONS.MANAGE_SYSTEM_CONFIG)) {
    return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
  }
  // ... rest of handler
}
```

### Anti-Patterns to Avoid
- **Direct Supabase queries in components:** Always use API routes
- **Skipping audit logging:** All CRUD operations must be logged
- **Hardcoding instruction types:** Use enum/const from validation schema
- **Missing ADMIN role check:** INST-09 requires ADMIN-only access

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validation logic | Zod schema + react-hook-form | Already established pattern, type-safe |
| Toast notifications | Custom alert system | sonner (toast) | Already used throughout codebase |
| Modal dialogs | Custom modal | shadcn Dialog | Consistent UX, accessibility handled |
| Table display | Custom grid | shadcn Table | Already used in Services, Pre-Checkin |
| Status badges | Custom styling | shadcn Badge | Consistent with existing badges |
| Pagination | Custom pagination | Follow ServicePagination pattern | Already implemented |
| WhatsApp bubble CSS | Complex library | Pure CSS (see Code Examples) | Simple requirement, no dependencies |

**Key insight:** The codebase has well-established patterns for every component needed. Copy the Services CRUD pattern directly.

## Common Pitfalls

### Pitfall 1: Missing Prisma Model
**What goes wrong:** `instrucoes_procedimentos` table exists in Supabase but not in Prisma schema
**Why it happens:** Table was created via raw SQL migration, not Prisma
**How to avoid:** Add model to `schema.prisma` before implementing API routes
**Warning signs:** Prisma client errors about unknown table

### Pitfall 2: Soft Delete Confusion
**What goes wrong:** Using DELETE instead of updating `ativo=false` (INST-07)
**Why it happens:** Habit of implementing hard delete
**How to avoid:** API route should use PATCH to set `ativo=false`, not DELETE
**Warning signs:** Records disappearing from database, N8N losing instruction references

### Pitfall 3: Embedding Column
**What goes wrong:** Trying to read/write the `embedding` vector column from Prisma
**Why it happens:** Prisma doesn't have native pgvector support
**How to avoid:** Exclude `embedding` from Prisma model with `@ignore` or handle separately
**Warning signs:** Type errors, serialization failures

### Pitfall 4: WhatsApp Preview Styling
**What goes wrong:** Preview doesn't look like actual WhatsApp
**Why it happens:** Using generic chat styling instead of WhatsApp-specific colors
**How to avoid:** Use WhatsApp green (#DCF8C6 or #25D366), bubble tail shapes
**Warning signs:** User feedback that preview doesn't match reality

### Pitfall 5: Service Dropdown Empty
**What goes wrong:** No services shown in form dropdown
**Why it happens:** Services API requires ADMIN role, or no active services
**How to avoid:** Fetch services separately, handle empty state
**Warning signs:** Empty select dropdown, API 403 errors

### Pitfall 6: Forgetting Audit Logging
**What goes wrong:** HIPAA compliance violation - operations not logged
**Why it happens:** Focus on functionality, forget audit trail
**How to avoid:** Add audit logging to all CRUD operations, add new AuditAction enum values
**Warning signs:** Missing entries in audit_logs table

## Code Examples

Verified patterns from existing codebase:

### Prisma Model for instrucoes_procedimentos
```prisma
// Add to prisma/schema.prisma
// Source: Database schema from database/001_pre_checkin_tables.sql

// Instruction type enum
enum InstructionType {
  preparo
  jejum
  medicamentos
  vestuario
  acompanhante
  documentos
  geral
}

model ProcedureInstruction {
  id            Int             @id @default(autoincrement())
  servicoId     Int?            @map("servico_id")
  tipoInstrucao InstructionType @map("tipo_instrucao")
  titulo        String          @db.VarChar(200)
  conteudo      String          @db.Text
  // embedding vector(1536) - EXCLUDED: pgvector not supported by Prisma
  prioridade    Int             @default(0)
  ativo         Boolean         @default(true)
  createdAt     DateTime        @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime        @updatedAt @map("updated_at") @db.Timestamptz

  @@index([servicoId])
  @@index([tipoInstrucao])
  @@index([ativo])
  @@map("instrucoes_procedimentos")
}
```

### Zod Validation Schema
```typescript
// src/lib/validations/instruction.ts
import { z } from 'zod';

export const INSTRUCTION_TYPES = [
  'preparo',
  'jejum',
  'medicamentos',
  'vestuario',
  'acompanhante',
  'documentos',
  'geral',
] as const;

export type InstructionType = typeof INSTRUCTION_TYPES[number];

export const INSTRUCTION_TYPE_LABELS: Record<InstructionType, string> = {
  preparo: 'Preparo',
  jejum: 'Jejum',
  medicamentos: 'Medicamentos',
  vestuario: 'Vestuario',
  acompanhante: 'Acompanhante',
  documentos: 'Documentos',
  geral: 'Geral',
};

export const instructionSchema = z.object({
  servicoId: z.number().int().positive().nullable(),
  tipoInstrucao: z.enum(INSTRUCTION_TYPES),
  titulo: z.string().min(3, 'Titulo deve ter pelo menos 3 caracteres').max(200),
  conteudo: z.string().min(10, 'Conteudo deve ter pelo menos 10 caracteres'),
  prioridade: z.number().int().min(0).max(100).default(0),
  ativo: z.boolean().default(true),
});

export type InstructionInput = z.infer<typeof instructionSchema>;
```

### WhatsApp Preview Component (CSS Chat Bubble)
```typescript
// src/components/instructions/whatsapp-preview.tsx
'use client';

import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

// WhatsApp colors
const WHATSAPP_GREEN = '#DCF8C6'; // Light green for outgoing messages
const WHATSAPP_DARK = '#075E54';  // Dark green for header

// Character thresholds for warnings
const CHAR_WARNING_THRESHOLD = 1000;  // Yellow warning
const CHAR_DANGER_THRESHOLD = 2000;   // Red warning

interface WhatsAppPreviewProps {
  content: string;
  title?: string;
}

export function WhatsAppPreview({ content, title }: WhatsAppPreviewProps) {
  // Replace template variables with sample data
  const formattedContent = useMemo(() => {
    return content
      .replace(/\{nome_paciente\}/g, 'Joao Silva')
      .replace(/\{data_consulta\}/g, '15/01 as 14h')
      .replace(/\{servico\}/g, 'Limpeza de Pele')
      .replace(/\{profissional\}/g, 'Dra. Paula')
      .replace(/\{clinica\}/g, 'Clinica Estetica');
  }, [content]);

  const charCount = content.length;
  const isWarning = charCount >= CHAR_WARNING_THRESHOLD;
  const isDanger = charCount >= CHAR_DANGER_THRESHOLD;

  return (
    <div className="space-y-2">
      {/* Preview label */}
      <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
        Preview WhatsApp
        {(isWarning || isDanger) && (
          <span className={`flex items-center gap-1 text-xs ${isDanger ? 'text-red-600' : 'text-yellow-600'}`}>
            <AlertTriangle className="h-3 w-3" />
            {isDanger ? 'Mensagem muito longa' : 'Mensagem longa'}
          </span>
        )}
      </div>

      {/* WhatsApp phone frame */}
      <div className="bg-[#ECE5DD] rounded-lg p-4 max-w-sm">
        {/* Chat bubble */}
        <div
          className="relative rounded-lg px-3 py-2 max-w-[85%] ml-auto"
          style={{ backgroundColor: WHATSAPP_GREEN }}
        >
          {/* Title if provided */}
          {title && (
            <div className="font-semibold text-gray-900 text-sm mb-1">
              {title}
            </div>
          )}

          {/* Message content */}
          <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">
            {formattedContent || 'Digite o conteudo da instrucao...'}
          </div>

          {/* Timestamp */}
          <div className="text-[10px] text-gray-600 text-right mt-1">
            14:30
          </div>

          {/* Bubble tail */}
          <div
            className="absolute -right-2 top-0 w-0 h-0"
            style={{
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: `8px solid ${WHATSAPP_GREEN}`,
            }}
          />
        </div>
      </div>

      {/* Character count */}
      <div className={`text-xs ${isDanger ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-gray-500'}`}>
        {charCount} caracteres
        {isDanger && ' - Considere resumir a mensagem'}
        {isWarning && !isDanger && ' - Mensagem pode ser truncada em alguns dispositivos'}
      </div>
    </div>
  );
}
```

### Instruction Type Badge with Icons
```typescript
// src/components/instructions/instruction-type-badge.tsx
import { Badge } from '@/components/ui/badge';
import {
  Stethoscope,    // preparo
  UtensilsCrossed, // jejum
  Pill,           // medicamentos
  Shirt,          // vestuario
  Users,          // acompanhante
  FileText,       // documentos
  Info,           // geral
} from 'lucide-react';
import { InstructionType, INSTRUCTION_TYPE_LABELS } from '@/lib/validations/instruction';

const TYPE_ICONS: Record<InstructionType, React.ComponentType<any>> = {
  preparo: Stethoscope,
  jejum: UtensilsCrossed,
  medicamentos: Pill,
  vestuario: Shirt,
  acompanhante: Users,
  documentos: FileText,
  geral: Info,
};

const TYPE_COLORS: Record<InstructionType, string> = {
  preparo: 'bg-blue-100 text-blue-800',
  jejum: 'bg-orange-100 text-orange-800',
  medicamentos: 'bg-purple-100 text-purple-800',
  vestuario: 'bg-pink-100 text-pink-800',
  acompanhante: 'bg-green-100 text-green-800',
  documentos: 'bg-yellow-100 text-yellow-800',
  geral: 'bg-gray-100 text-gray-800',
};

interface InstructionTypeBadgeProps {
  type: InstructionType;
}

export function InstructionTypeBadge({ type }: InstructionTypeBadgeProps) {
  const Icon = TYPE_ICONS[type];
  return (
    <Badge variant="outline" className={`${TYPE_COLORS[type]} gap-1`}>
      <Icon className="h-3 w-3" />
      {INSTRUCTION_TYPE_LABELS[type]}
    </Badge>
  );
}
```

### Audit Actions to Add
```typescript
// Add to src/lib/audit/logger.ts
export enum AuditAction {
  // ... existing actions ...

  // Instruction management
  VIEW_INSTRUCTION = 'VIEW_INSTRUCTION',
  CREATE_INSTRUCTION = 'CREATE_INSTRUCTION',
  UPDATE_INSTRUCTION = 'UPDATE_INSTRUCTION',
  DEACTIVATE_INSTRUCTION = 'DEACTIVATE_INSTRUCTION',
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Supabase nodes in N8N | Postgres nodes with SQL | Jan 2026 | N8N uses raw SQL, not Supabase client |
| Rich text instructions | Plain text with variables | Current | WhatsApp doesn't support rich text |
| Hard delete | Soft delete (ativo=false) | Design decision | Preserves data integrity for N8N |

**Deprecated/outdated:**
- Embedding generation in admin UI: Embeddings are generated by N8N workflow, not by the admin console
- Direct Supabase mutations: All data access goes through Prisma

## Open Questions

Things that couldn't be fully resolved:

1. **Service dropdown for null servicoId**
   - What we know: Instructions can have `servico_id=NULL` for general instructions
   - What's unclear: How to display "All Services" option in dropdown
   - Recommendation: Add special option at top of service dropdown with value `null`

2. **Embedding column handling**
   - What we know: Prisma doesn't natively support pgvector
   - What's unclear: Whether to use `@ignore` or Unsupported type
   - Recommendation: Exclude from Prisma model entirely, embeddings handled by N8N

## Sources

### Primary (HIGH confidence)
- `/Users/gilberto/projetos/botfy/botfy-clinicas-n8n/database/001_pre_checkin_tables.sql` - Table schema
- `/Users/gilberto/projetos/botfy/botfy-clinicas-n8n/database/002_instrucoes_exemplo.sql` - Example data
- `/Users/gilberto/projetos/botfy/botfy-clinicas-n8n/src/app/api/servicos/route.ts` - API pattern
- `/Users/gilberto/projetos/botfy/botfy-clinicas-n8n/src/components/services/service-form-modal.tsx` - Form pattern
- `/Users/gilberto/projetos/botfy/botfy-clinicas-n8n/src/lib/validations/service.ts` - Validation pattern
- `/Users/gilberto/projetos/botfy/botfy-clinicas-n8n/src/lib/rbac/permissions.ts` - RBAC pattern
- `/Users/gilberto/projetos/botfy/botfy-clinicas-n8n/src/lib/audit/logger.ts` - Audit logging

### Secondary (MEDIUM confidence)
- [Flowbite Tailwind CSS Chat Bubble](https://flowbite.com/docs/components/chat-bubble/) - WhatsApp-style component patterns
- [Pure CSS WhatsApp Desktop Speech Bubble](https://codepen.io/8eni/pen/YWoRGm) - CSS bubble styling reference
- WhatsApp character limits research - 65,536 max, 4,096 for templates

### Tertiary (LOW confidence)
- None - all patterns verified against existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in codebase
- Architecture: HIGH - Direct copy of existing Services CRUD pattern
- Pitfalls: HIGH - Based on database schema and codebase analysis
- WhatsApp Preview: MEDIUM - CSS-only approach, may need visual refinement

**Research date:** 2026-01-21
**Valid until:** 2026-02-21 (stable domain, no external dependencies)
