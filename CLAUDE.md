# Claude AI - Guia de Desenvolvimento Botfy ClinicOps

Guia para Claude AI trabalhar efetivamente no projeto Botfy ClinicOps Console Administrativo.

## Visão Geral

**O que é este projeto?**
Console administrativo web (Next.js) para gerenciar sistema de automação de clínicas via WhatsApp. O backend é N8N com workflows automatizados.

**Seu papel:**
- Desenvolver features do console administrativo (frontend Next.js)
- NÃO modificar workflows N8N (apenas consultar/integrar)
- Manter padrões de código e arquitetura existentes

## Antes de Começar Qualquer Task

### 1. Leia a Documentação Relevante

```bash
# Visão geral e setup
@README.md

# Workflows N8N e tabelas Supabase
@AGENTS.md

# Planejamento e roadmap
@.planning/STATE.md
@.planning/ROADMAP.md
```

### 2. Entenda o Contexto

- **Fase atual**: Verifique `.planning/STATE.md` para saber em qual phase estamos
- **Requirements**: Consulte `.planning/REQUIREMENTS.md` para ver requisitos
- **Plans existentes**: Cheque `.planning/phases/{phase}/` para plans já criados

### 3. Use as Ferramentas Corretas

| Necessidade | Ferramenta | Quando Usar |
|-------------|------------|-------------|
| Buscar arquivos | `Glob` | Procurar por padrão de nome (`**/*.tsx`) |
| Buscar código | `Grep` | Procurar por texto/regex no código |
| Ler arquivo | `Read` | Ler conteúdo de arquivo específico |
| Editar arquivo | `Edit` | Modificar arquivo existente (SEMPRE preferir sobre Write) |
| Criar arquivo | `Write` | Apenas quando arquivo NÃO existe |
| Executar comando | `Bash` | Git, npm, scripts shell |
| Consultar docs | `mcp__context7__query-docs` | Quando tiver dúvidas sobre bibliotecas |

## Padrões de Código

### Estrutura de Arquivos

```
src/
├── app/                    # Next.js App Router (páginas e API routes)
│   ├── (auth)/            # Grupo de rotas com auth
│   │   ├── dashboard/
│   │   ├── pacientes/
│   │   └── agenda/
│   └── api/               # API Routes (backend Next.js)
├── components/            # Componentes React
│   ├── ui/               # shadcn/ui (NÃO modificar diretamente)
│   ├── calendar/         # Componentes de calendário
│   └── layout/           # Layouts e navegação
├── lib/                  # Utilitários e helpers
│   ├── supabase/        # Cliente Supabase
│   ├── auth/            # Autenticação e RBAC
│   └── validations/     # Schemas Zod
└── hooks/               # React Hooks customizados
```

### Convenções de Nomenclatura

```typescript
// Componentes: PascalCase
export function PatientList() {}

// Hooks: camelCase com prefixo use
export function useCalendarEvents() {}

// Utilitários: camelCase
export function formatCPF() {}

// Tipos: PascalCase
export type Patient = {}

// Constantes: SCREAMING_SNAKE_CASE
export const DEFAULT_PAGE_SIZE = 20
```

### Padrões React/Next.js

```typescript
// ✅ CORRETO - Server Component (padrão)
export default async function PacientesPage() {
  const user = await getCurrentUserWithRole()
  return <div>...</div>
}

// ✅ CORRETO - Client Component (quando necessário)
'use client'
export function InteractiveComponent() {
  const [state, setState] = useState()
  return <div>...</div>
}

// ❌ EVITAR - Misturar server e client sem necessidade
'use client'  // Só use quando REALMENTE preciso (useState, useEffect, onClick)
export default function Page() {}
```

### Padrões de API Routes

```typescript
// src/app/api/pacientes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    // 1. Autenticação
    const user = await getCurrentUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validação de permissões (RBAC)
    if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 3. Lógica de negócio
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')

    if (error) throw error

    // 4. Resposta
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
```

### Padrões de Validação

```typescript
// ✅ SEMPRE use Zod para validação
import { z } from 'zod'

const createPatientSchema = z.object({
  nome: z.string().min(3, 'Nome muito curto'),
  telefone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido'),
  email: z.string().email('Email inválido').optional(),
})

// Em API routes
const validatedData = createPatientSchema.parse(body)

// Em forms (client)
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const form = useForm({
  resolver: zodResolver(createPatientSchema),
})
```

## Quando Usar Context7

**SEMPRE consulte documentação ANTES de usar bibliotecas novas ou recursos complexos.**

```typescript
// 1. Resolver biblioteca
mcp__context7__resolve-library-id({
  query: "schedule-x react calendar",
  libraryName: "schedule-x"
})

// 2. Consultar documentação específica
mcp__context7__query-docs({
  libraryId: "/schedule-x/schedule-x",
  query: "how to add events to calendar"
})
```

**Casos de uso comuns:**
- Schedule-X: configuração de calendário, eventos, views
- date-fns/tz: timezone handling, DST
- shadcn/ui: componentes específicos
- Supabase: queries complexas, RLS
- Next.js: App Router features, API routes

## Integração com N8N

### O que PODE fazer:
- ✅ Chamar webhooks N8N via `fetch()`
- ✅ Ler dados das tabelas Supabase usadas pelo N8N
- ✅ Consultar `AGENTS.md` para entender workflows

### O que NÃO PODE fazer:
- ❌ Modificar workflows N8N diretamente
- ❌ Alterar schema de tabelas usadas pelo N8N (`n8n_chat_histories`, `lembretes_enviados`, etc)
- ❌ Interferir com lógica de automação do N8N

### Exemplo de Integração

```typescript
// ✅ CORRETO - Chamar webhook N8N
const notifyN8N = async (appointmentId: string) => {
  const webhookUrl = process.env.N8N_WEBHOOK_APPOINTMENT_CREATED

  if (!webhookUrl) {
    console.warn('N8N webhook not configured')
    return
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId, ... })
    })
  } catch (error) {
    // NÃO falhar se N8N webhook falhar
    console.error('N8N notification failed:', error)
  }
}
```

## Segurança e HIPAA Compliance

### Sempre Implementar:

1. **Autenticação em todas as páginas/APIs**
   ```typescript
   const user = await getCurrentUserWithRole()
   if (!user) redirect('/auth/login')
   ```

2. **RBAC (Role-Based Access Control)**
   ```typescript
   if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
     return { error: 'Forbidden' }
   }
   ```

3. **Audit Logging**
   ```typescript
   import { logAudit, AuditAction } from '@/lib/audit/logger'

   await logAudit({
     userId: user.id,
     action: AuditAction.UPDATE_PATIENT,
     resource: 'pacientes',
     resourceId: patientId,
     details: { changes: updatedFields }
   })
   ```

4. **RLS (Row Level Security) no Supabase**
   - NUNCA desabilitar RLS
   - SEMPRE usar políticas de acesso por role

5. **Não expor PHI nos logs**
   ```typescript
   // ❌ ERRADO
   console.log('Patient data:', patient)

   // ✅ CORRETO
   console.log('Patient updated:', patient.id)
   ```

## Timezone Handling

**SEMPRE use TZDate para datas/horários:**

```typescript
import { TZDate } from '@date-fns/tz'
import { createClinicDate } from '@/lib/calendar/time-zone-utils'

// ✅ CORRETO - DST-aware
const appointmentTime = createClinicDate(2026, 0, 17, 14, 0)

// ❌ EVITAR - Pode causar bugs de DST
const appointmentTime = new Date(2026, 0, 17, 14, 0)
```

**Brazil timezone**: `America/Sao_Paulo` (DST transitions em fev/nov)

## Git Workflow

### Commits

```bash
# Formato: type(scope): message
git commit -m "feat(agenda): add waitlist auto-fill on cancellation"
git commit -m "fix(pacientes): correct CPF validation regex"
git commit -m "docs(readme): update n8n integration section"
```

**Types:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

**Scopes:** `agenda`, `pacientes`, `auth`, `api`, `calendar`, etc.

### Branches

```bash
# Desenvolvimento
git checkout -b feature/calendar-filtering
git checkout -b fix/timezone-dst-bug

# Merge para main
git checkout main
git merge feature/calendar-filtering
```

## Checklist Antes de Criar/Modificar Código

- [ ] Li o plan relevante em `.planning/phases/{phase}/`?
- [ ] Entendi os requirements em `.planning/REQUIREMENTS.md`?
- [ ] Consultei `AGENTS.md` se envolve N8N/Supabase?
- [ ] Usei Context7 para bibliotecas que não conheço bem?
- [ ] Implementei autenticação e RBAC?
- [ ] Adicionei audit logging para operações críticas?
- [ ] Usei TZDate para datas/horários?
- [ ] Validei input com Zod?
- [ ] Tratei erros adequadamente?
- [ ] Não expus PHI nos logs?
- [ ] Testei localmente antes de commitar?

## Comandos Úteis

```bash
# Desenvolvimento
./start-dev.sh                    # Inicia dev server (porta 3051)
PORT=3051 npm run dev             # Alternativa manual

# Database
npx prisma generate               # Gera Prisma client
npx prisma migrate dev            # Aplica migrations
npx prisma studio                 # Interface visual do DB

# Build
npm run build                     # Build de produção
npm run start                     # Servidor de produção

# Testes N8N
./test-workflows.sh               # Testa webhooks N8N
```

## Estrutura de Decisão Rápida

### Preciso criar nova funcionalidade?
1. Verifique se há plan em `.planning/phases/{phase}/`
2. Se não, pergunte ao usuário se deve criar plan primeiro
3. Se sim, siga o plan passo a passo

### Preciso modificar código existente?
1. SEMPRE use `Edit` tool (nunca `Write` para sobrescrever)
2. Leia o arquivo completo primeiro com `Read`
3. Entenda o contexto antes de modificar

### Preciso integrar com N8N?
1. Consulte `AGENTS.md` para entender workflows
2. Use webhooks (não modifique workflows)
3. Trate falhas de webhook graciosamente (não bloqueie UX)

### Preciso usar biblioteca nova?
1. Use Context7 para consultar documentação
2. Verifique exemplos oficiais
3. Não adivinhe APIs, confirme com docs

### Encontrei bug?
1. Entenda a causa raiz
2. Crie fix mínimo (não refatore tudo)
3. Adicione comment explicando o problema
4. Commit com mensagem clara

## Referências Rápidas

| Documento | Quando Consultar |
|-----------|------------------|
| `README.md` | Setup, overview, deploy |
| `AGENTS.md` | Workflows N8N, tabelas Supabase, troubleshooting |
| `.planning/STATE.md` | Fase atual, progresso |
| `.planning/ROADMAP.md` | Fases futuras, requirements |
| `.planning/REQUIREMENTS.md` | Requirements detalhados |
| `.planning/phases/{phase}/` | Plans específicos de cada fase |

## Mensagens Importantes

- **NUNCA modifique workflows N8N** - apenas integre via webhooks
- **SEMPRE prefira Edit sobre Write** - não sobrescreva arquivos sem ler
- **SEMPRE use Context7** - não adivinhe APIs de bibliotecas
- **SEMPRE implemente auth/RBAC** - segurança é crítica (HIPAA)
- **SEMPRE use TZDate** - evite bugs de DST
- **SEMPRE faça audit log** - compliance HIPAA exige rastreabilidade

## Em Caso de Dúvida

1. **Consulte documentação** (`README.md`, `AGENTS.md`, `.planning/*`)
2. **Use Context7** para bibliotecas específicas
3. **Leia código existente** para entender padrões
4. **Pergunte ao usuário** se ainda incerto

---

**Lembre-se**: Este é um sistema de produção com dados sensíveis de pacientes (HIPAA). Segurança e qualidade são prioridade máxima.
