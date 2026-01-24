# Architecture Research

**Domain:** Admin Dashboard / Operations Console (Healthcare SaaS)
**Researched:** 2025-01-15
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER (Client)                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Dashboard   │  │  Scheduling  │  │  Patients    │  │  Settings    │         │
│  │  (Server)    │  │  (Client)    │  │  (Server)    │  │  (Client)    │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                 │                 │                 │
│         │      ┌──────────┴─────────────────┴─────────┐       │                 │
│         │      │   Real-time Subscriptions (Client)   │       │                 │
│         │      │   useEffect + Supabase Channels       │       │                 │
│         │      └──────────┬─────────────────────────────┘      │                 │
├─────────┴────────────────┴─────────────────────────────────────┴─────────────────┤
│                          APPLICATION LAYER (Server)                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐        │
│  │                      Next.js Middleware                              │        │
│  │  - Auth Verification (Supabase Session Refresh)                      │        │
│  │  - Route Protection (Role-based Guards)                              │        │
│  │  - Cookie Management (createServerClient)                            │        │
│  └─────────────────────────┬───────────────────────────────────────────┘        │
│                            │                                                     │
│  ┌─────────────────────────┴───────────────────────────────────────────┐        │
│  │                      API Routes (Route Handlers)                     │        │
│  │  /api/auth/*         - Authentication endpoints                      │        │
│  │  /api/agendamentos/* - Scheduling operations                         │        │
│  │  /api/pacientes/*    - Patient management                            │        │
│  │  /api/alerts/*       - Real-time alerts                              │        │
│  └─────────────────────────┬───────────────────────────────────────────┘        │
│                            │                                                     │
│  ┌─────────────────────────┴───────────────────────────────────────────┐        │
│  │                     Business Logic Layer                             │        │
│  │  /lib/services/     - Domain services (pure functions)               │        │
│  │  /lib/queries/      - Database queries (reusable)                    │        │
│  │  /lib/mutations/    - Data mutations (reusable)                      │        │
│  └─────────────────────────┬───────────────────────────────────────────┘        │
├────────────────────────────┴─────────────────────────────────────────────────────┤
│                          DATA LAYER                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Supabase    │  │  Supabase    │  │  Supabase    │  │  Supabase    │         │
│  │  Auth        │  │  Database    │  │  Realtime    │  │  Storage     │         │
│  │  (Session)   │  │  (Postgres)  │  │  (Channels)  │  │  (Files)     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Server Components** | Data fetching, initial render, SEO | `async` functions, direct DB queries, no interactivity |
| **Client Components** | Interactivity, real-time updates, state | `'use client'`, hooks, event handlers |
| **Middleware** | Auth verification, session refresh, route protection | `createServerClient` with cookie handlers |
| **API Routes** | Server-side mutations, external integrations | Route Handlers in `app/api/*` |
| **Business Logic** | Pure domain functions, reusable operations | `lib/services/*`, exported functions |
| **Supabase Clients** | Database access, auth, real-time | Singleton pattern for browser, factory for server |

## Recommended Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group - Auth pages (public)
│   │   ├── login/
│   │   │   ├── page.tsx          # Login page (Server Component)
│   │   │   └── _components/      # Login-specific UI components
│   │   ├── register/
│   │   └── layout.tsx            # Auth layout (centered, no sidebar)
│   │
│   ├── (dashboard)/              # Route group - Protected admin area
│   │   ├── dashboard/
│   │   │   ├── page.tsx          # Dashboard home (Server Component)
│   │   │   └── _components/      # Dashboard widgets
│   │   │       ├── stats-card.tsx
│   │   │       ├── alerts-panel.tsx  # Real-time alerts (Client)
│   │   │       └── recent-activity.tsx
│   │   │
│   │   ├── agendamentos/         # Scheduling feature
│   │   │   ├── page.tsx          # List view (Server Component)
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx      # Detail view
│   │   │   └── _components/
│   │   │       ├── calendar.tsx       # Calendar UI (Client)
│   │   │       ├── appointment-form.tsx
│   │   │       └── status-badge.tsx
│   │   │
│   │   ├── pacientes/            # Patients feature
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── _components/
│   │   │
│   │   └── layout.tsx            # Dashboard layout (sidebar, header)
│   │
│   ├── api/                      # API Route Handlers
│   │   ├── auth/
│   │   │   ├── callback/
│   │   │   │   └── route.ts      # OAuth callback
│   │   │   └── signout/
│   │   │       └── route.ts      # Sign out handler
│   │   │
│   │   ├── agendamentos/
│   │   │   ├── route.ts          # POST /api/agendamentos
│   │   │   └── [id]/
│   │   │       └── route.ts      # PATCH/DELETE /api/agendamentos/:id
│   │   │
│   │   └── webhooks/
│   │       └── n8n/
│   │           └── route.ts      # N8N webhook endpoint
│   │
│   ├── layout.tsx                # Root layout (html, body, providers)
│   └── middleware.ts             # Auth middleware (sibling to app/)
│
├── components/                   # Shared UI components
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   │
│   └── shared/                   # Custom shared components
│       ├── data-table.tsx
│       ├── page-header.tsx
│       └── loading-spinner.tsx
│
├── lib/                          # Core utilities and configuration
│   ├── supabase/
│   │   ├── client.ts             # Browser client (singleton)
│   │   ├── server.ts             # Server client factory
│   │   └── middleware.ts         # Middleware client factory
│   │
│   ├── services/                 # Business logic (pure functions)
│   │   ├── agendamentos.ts       # Scheduling domain logic
│   │   ├── pacientes.ts          # Patient management
│   │   └── notifications.ts      # Notification logic
│   │
│   ├── queries/                  # Reusable database queries
│   │   ├── agendamentos.ts
│   │   └── pacientes.ts
│   │
│   ├── mutations/                # Reusable data mutations
│   │   ├── agendamentos.ts
│   │   └── pacientes.ts
│   │
│   ├── validations/              # Zod schemas
│   │   ├── agendamento.ts
│   │   └── paciente.ts
│   │
│   └── utils/                    # Generic utilities
│       ├── date.ts
│       ├── format.ts
│       └── cn.ts                 # Class name utility
│
├── hooks/                        # Custom React hooks
│   ├── use-realtime-agendamentos.ts  # Real-time subscription hook
│   ├── use-user.ts               # Auth user hook
│   └── use-toast.ts              # Toast notifications
│
├── types/                        # TypeScript definitions
│   ├── database.ts               # Supabase generated types
│   ├── api.ts                    # API response types
│   └── domain.ts                 # Domain models
│
└── config/                       # Configuration files
    ├── site.ts                   # Site metadata
    └── constants.ts              # App constants
```

### Structure Rationale

- **Route groups `(auth)` and `(dashboard)`**: Organize routes without affecting URLs. Allows different layouts for public vs protected areas.
- **`_components/` folders**: Colocated components specific to a route. Underscore prefix prevents routing.
- **`lib/supabase/`**: Centralized Supabase client creation. Browser client is singleton, server clients are per-request.
- **`lib/services/`**: Pure business logic separate from framework. Testable, reusable across Server Actions and API Routes.
- **`lib/queries/` and `lib/mutations/`**: Separation between reads and writes. Query functions can be used in Server Components, mutations in Server Actions/API Routes.
- **Feature-based `_components/`**: Keeps route-specific UI close to where it's used. Only truly shared components go in top-level `components/`.

## Architectural Patterns

### Pattern 1: Supabase Client Creation (SSR-Safe)

**What:** Factory pattern for creating Supabase clients with proper cookie handling based on execution context.

**When to use:** Every time you need to interact with Supabase from server-side code (middleware, Server Components, Server Actions, Route Handlers).

**Trade-offs:**
- **Pros**: Automatic session refresh, type-safe, framework-agnostic cookie handling
- **Cons**: Must create new client per request (can't cache), cookie handlers vary by context

**Example:**

```typescript
// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Automatically refreshes session if expired
  const { data: { user } } = await supabase.auth.getUser()

  return { response, user }
}

// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

// lib/supabase/client.ts (Browser - Singleton)
import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (client) return client

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return client
}
```

**Source:** [Supabase SSR Documentation](https://github.com/supabase/ssr) (HIGH confidence)

---

### Pattern 2: Authentication Middleware (Route Protection)

**What:** Next.js middleware that verifies Supabase session and enforces role-based access control before rendering pages.

**When to use:** Protect admin dashboard routes, redirect unauthenticated users, refresh sessions automatically.

**Trade-offs:**
- **Pros**: Runs before page render, automatic session refresh, single source of truth for auth
- **Cons**: Adds latency to every request, limited to edge runtime (no Node.js APIs)

**Example:**

```typescript
// middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)

  // Redirect unauthenticated users to login
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Source:** [Next.js Middleware Docs](https://nextjs.org/docs/app/guides/authentication) + Supabase SSR (HIGH confidence)

---

### Pattern 3: Real-time Subscriptions (Client Component)

**What:** Custom React hook that subscribes to Supabase Realtime channels and automatically cleans up on unmount.

**When to use:** Dashboard alerts, live appointment updates, collaborative features, any data that changes server-side and needs to reflect instantly.

**Trade-offs:**
- **Pros**: Instant updates without polling, low latency, automatic reconnection
- **Cons**: Must enable Realtime on Supabase table, requires Client Component, can cause unnecessary re-renders if not optimized

**Example:**

```typescript
// hooks/use-realtime-agendamentos.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Agendamento } from '@/types/database'

export function useRealtimeAgendamentos(initialData: Agendamento[]) {
  const [agendamentos, setAgendamentos] = useState(initialData)
  const supabase = createClient()

  useEffect(() => {
    // Create channel for real-time updates
    const channel = supabase
      .channel('agendamentos-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'agendamentos',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAgendamentos((current) => [...current, payload.new as Agendamento])
          } else if (payload.eventType === 'UPDATE') {
            setAgendamentos((current) =>
              current.map((item) =>
                item.id === payload.new.id ? (payload.new as Agendamento) : item
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setAgendamentos((current) =>
              current.filter((item) => item.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return agendamentos
}

// Usage in component:
// app/(dashboard)/dashboard/_components/alerts-panel.tsx
'use client'

import { useRealtimeAgendamentos } from '@/hooks/use-realtime-agendamentos'

export function AlertsPanel({ initialAgendamentos }: { initialAgendamentos: Agendamento[] }) {
  const agendamentos = useRealtimeAgendamentos(initialAgendamentos)

  return (
    <div>
      {agendamentos.map((agendamento) => (
        <AlertCard key={agendamento.id} agendamento={agendamento} />
      ))}
    </div>
  )
}
```

**Source:** [Supabase Realtime with Next.js](https://supabase.com/docs/guides/realtime/realtime-with-nextjs) + React Docs (HIGH confidence)

---

### Pattern 4: Server Component Data Fetching with Reusable Queries

**What:** Separate data fetching logic into reusable query functions, called from Server Components or Server Actions.

**When to use:** Initial page loads, data that doesn't need real-time updates, SEO-critical content.

**Trade-offs:**
- **Pros**: Excellent performance (no client JS), SEO-friendly, type-safe, reusable across routes
- **Cons**: No interactivity without Client Components, requires async Server Components

**Example:**

```typescript
// lib/queries/agendamentos.ts
import { createClient } from '@/lib/supabase/server'
import type { Agendamento } from '@/types/database'

export async function getAgendamentos(filters?: {
  date?: string
  status?: string
}): Promise<Agendamento[]> {
  const supabase = createClient()

  let query = supabase
    .from('agendamentos')
    .select('*, paciente:pacientes(*), servico:servicos(*)')
    .order('data_hora', { ascending: true })

  if (filters?.date) {
    query = query.gte('data_hora', `${filters.date}T00:00:00`)
                 .lt('data_hora', `${filters.date}T23:59:59`)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

// app/(dashboard)/agendamentos/page.tsx
import { getAgendamentos } from '@/lib/queries/agendamentos'
import { AgendamentosList } from './_components/agendamentos-list'

export default async function AgendamentosPage() {
  const agendamentos = await getAgendamentos()

  return (
    <div>
      <h1>Agendamentos</h1>
      {/* Pass data to Client Component for interactivity */}
      <AgendamentosList initialData={agendamentos} />
    </div>
  )
}
```

**Source:** [Next.js Data Fetching](https://nextjs.org/docs/app/guides/migrating/app-router-migration) (HIGH confidence)

---

### Pattern 5: State Management - Server State vs UI State

**What:** Separate server state (data from Supabase) from UI state (modals, sidebars, forms) using appropriate tools.

**When to use:**
- **Server state**: Use React Query (TanStack Query) or SWR for data from API/database
- **UI state**: Use Zustand or Context API for client-only state

**Trade-offs:**
- **Pros**: Clear separation of concerns, automatic caching/revalidation (React Query), minimal boilerplate (Zustand)
- **Cons**: Additional dependency, learning curve, can be overkill for simple apps

**Example:**

```typescript
// lib/stores/ui-store.ts (Zustand for UI state)
import { create } from 'zustand'

interface UIStore {
  sidebarOpen: boolean
  toggleSidebar: () => void
  currentModal: string | null
  openModal: (modalId: string) => void
  closeModal: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  currentModal: null,
  openModal: (modalId) => set({ currentModal: modalId }),
  closeModal: () => set({ currentModal: null }),
}))

// For server state, prefer real-time subscriptions or Server Components
// Only use React Query if you need advanced caching/refetching logic
```

**Source:** [React Query vs Zustand](https://geekyants.com/blog/react-query-as-a-state-manager-in-nextjs-do-you-still-need-redux-or-zustand) + [State Management Guide](https://www.pronextjs.dev/tutorials/state-management) (HIGH confidence)

---

### Pattern 6: Row Level Security (RLS) for Multi-Tenant Data Isolation

**What:** Postgres policies that automatically filter data based on authenticated user's role or tenant ID.

**When to use:** Multi-tenant admin dashboard where different clinics/organizations share the same database but must never see each other's data.

**Trade-offs:**
- **Pros**: Database-level security, impossible to bypass from client, works with all Supabase clients
- **Cons**: Can impact performance on large datasets, complex policies are hard to debug, requires careful testing

**Example:**

```sql
-- Enable RLS on table
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- Policy: Admin users see all appointments
CREATE POLICY "Admins can view all agendamentos"
  ON agendamentos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Clinic staff see only their clinic's appointments
CREATE POLICY "Staff can view clinic agendamentos"
  ON agendamentos
  FOR SELECT
  TO authenticated
  USING (
    clinica_id = (
      SELECT clinica_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Patients see only their own appointments
CREATE POLICY "Patients can view own agendamentos"
  ON agendamentos
  FOR SELECT
  TO authenticated
  USING (
    paciente_id = auth.uid()
  );
```

**Best Practices:**
- Enable RLS from day one - retrofitting is painful
- Use JWT custom claims (`auth.jwt()`) to store role/tenant_id for faster policies
- Add indexes on columns used in policies (e.g., `clinica_id`, `user_id`)
- Never use `service_role` key in client code - it bypasses RLS
- Test policies thoroughly - use `EXPLAIN ANALYZE` to check performance

**Source:** [Supabase RLS Best Practices](https://www.leanware.co/insights/supabase-best-practices) + [Multi-Tenant RLS](https://dev.to/blackie360/-enforcing-row-level-security-in-supabase-a-deep-dive-into-lockins-multi-tenant-architecture-4hd2) (HIGH confidence)

## Data Flow

### Request Flow (Server-Side Rendering)

```
[User Request]
    ↓
[Next.js Middleware] → [Supabase Auth] → Verify Session
    ↓                                      ↓
[Protected Route]                     [Refresh if expired]
    ↓
[Server Component] → [lib/queries/*] → [Supabase Database]
    ↓                                      ↓
[Render HTML] ← [Data] ← [RLS Filter] ← [Query Results]
    ↓
[Send to Browser]
```

### State Management (Client-Side Interactivity)

```
[Server Component] → Initial Data → [Client Component Props]
                                           ↓
                                    [useRealtimeSubscription]
                                           ↓
                        ┌──────────────────┴──────────────────┐
                        ↓                                     ↓
              [Supabase Realtime]                    [Local State]
                        ↓                                     ↓
              [Postgres Changes]                      [useState/Zustand]
                        ↓                                     ↓
              [Channel Broadcast] ──────────────────> [Re-render UI]
```

### Mutation Flow (User Actions)

```
[User Action (Click/Submit)]
    ↓
[Client Component] → onSubmit() → [Server Action / API Route]
                                           ↓
                                  [lib/validations/*] → Validate Input
                                           ↓
                                  [lib/mutations/*] → Supabase Mutation
                                           ↓
                                  [Database Update] → RLS Check
                                           ↓
                                  [Realtime Broadcast] → All Subscribers
                                           ↓
                                  [Return Result] → Client
                                           ↓
                                  [UI Update / Toast]
```

### Key Data Flows

1. **Initial page load**: Middleware verifies auth → Server Component fetches data → HTML sent to browser with embedded data → Client Component hydrates → Real-time subscription starts

2. **Real-time update**: Database change occurs → Postgres triggers Realtime → Supabase broadcasts to channel → Client component receives event → Local state updates → UI re-renders

3. **User mutation**: Form submit → Server Action validates → Mutation executes → Database updates → Realtime broadcasts change → All connected clients update simultaneously

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-1k users** | Monolith Next.js app on Vercel + Supabase free tier. No optimization needed. |
| **1k-10k users** | Enable Supabase Pro for better connection pooling. Add database indexes on frequently queried columns. Consider React Query for client-side caching. |
| **10k-100k users** | Add CDN caching for static assets. Enable Supabase connection pooling (Supavisor). Use read replicas for analytics queries. Optimize real-time subscriptions (reduce channel count). |
| **100k+ users** | Consider database sharding by clinic/tenant. Move heavy background jobs to separate workers (N8N can handle this). Use Supabase Edge Functions for compute-heavy operations. Implement proper caching strategy (Redis). |

### Scaling Priorities

1. **First bottleneck: Database connections**
   - Supabase has connection limits on free tier (60 connections)
   - **Fix**: Enable connection pooling (Supavisor), upgrade to Pro tier, use read replicas for read-heavy queries

2. **Second bottleneck: Real-time subscriptions**
   - Too many channels per user causes memory issues
   - **Fix**: Consolidate channels (one channel per page, not per row), use filters in subscriptions, unsubscribe when components unmount

3. **Third bottleneck: Server Component performance**
   - Slow database queries block HTML rendering
   - **Fix**: Add database indexes, use `Suspense` boundaries to stream UI, cache expensive queries with `unstable_cache`

## Anti-Patterns

### Anti-Pattern 1: Using Client Components for Everything

**What people do:** Mark all components with `'use client'` to avoid errors

**Why it's wrong:**
- Loses benefits of Server Components (better performance, smaller bundle)
- Can't use async/await for data fetching
- Increases client-side JavaScript bundle size

**Do this instead:**
- Start with Server Components by default
- Only use `'use client'` when you need:
  - Event handlers (onClick, onChange)
  - React hooks (useState, useEffect)
  - Browser APIs (localStorage, window)
- Pass fetched data from Server Components to Client Components as props

**Example:**

```typescript
// ❌ WRONG - Fetching in Client Component
'use client'
import { useEffect, useState } from 'react'

export function Dashboard() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetch('/api/agendamentos')
      .then(res => res.json())
      .then(setData)
  }, [])

  return <div>{data.map(...)}</div>
}

// ✅ CORRECT - Server Component fetches, Client Component renders
// page.tsx (Server Component)
import { getAgendamentos } from '@/lib/queries/agendamentos'
import { DashboardClient } from './_components/dashboard-client'

export default async function Dashboard() {
  const agendamentos = await getAgendamentos()
  return <DashboardClient initialData={agendamentos} />
}

// _components/dashboard-client.tsx
'use client'
export function DashboardClient({ initialData }) {
  const [data, setData] = useState(initialData)
  // Use real-time subscriptions to update data
  return <div>{data.map(...)}</div>
}
```

---

### Anti-Pattern 2: Creating Supabase Client on Every Render

**What people do:** Call `createClient()` inside component body without memoization

**Why it's wrong:**
- Browser client should be singleton (created once)
- Server client should be created per request (in Server Component/Action)
- Creating multiple clients causes memory leaks and breaks session consistency

**Do this instead:**
- Browser: Import singleton client from `lib/supabase/client.ts`
- Server: Create fresh client per request in Server Components/Actions
- Never create client in Client Component body without `useMemo`

**Example:**

```typescript
// ❌ WRONG - New client on every render
'use client'
import { createBrowserClient } from '@supabase/ssr'

export function MyComponent() {
  const supabase = createBrowserClient(...) // RECREATED ON EVERY RENDER!
  // ...
}

// ✅ CORRECT - Use singleton pattern
'use client'
import { createClient } from '@/lib/supabase/client'

export function MyComponent() {
  const supabase = createClient() // Returns same instance every time
  // ...
}
```

---

### Anti-Pattern 3: Not Cleaning Up Real-time Subscriptions

**What people do:** Subscribe to Realtime channels without cleanup function in useEffect

**Why it's wrong:**
- Memory leaks - channels stay open after component unmounts
- Multiple subscriptions to same channel if component remounts
- Can hit Supabase connection limits

**Do this instead:** Always return cleanup function from useEffect that removes channel

**Example:**

```typescript
// ❌ WRONG - No cleanup
useEffect(() => {
  const channel = supabase
    .channel('changes')
    .on('postgres_changes', { ... }, (payload) => {
      console.log(payload)
    })
    .subscribe()
  // Missing cleanup!
}, [])

// ✅ CORRECT - Cleanup on unmount
useEffect(() => {
  const channel = supabase
    .channel('changes')
    .on('postgres_changes', { ... }, (payload) => {
      console.log(payload)
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [supabase])
```

---

### Anti-Pattern 4: Putting Business Logic in API Routes

**What people do:** Write all domain logic directly in API Route Handlers

**Why it's wrong:**
- Hard to test (requires mocking Next.js Request/Response)
- Can't reuse logic in Server Actions or other routes
- Tight coupling to framework

**Do this instead:** Extract business logic to pure functions in `lib/services/`, call from API Routes

**Example:**

```typescript
// ❌ WRONG - Logic in Route Handler
// app/api/agendamentos/route.ts
export async function POST(request: Request) {
  const data = await request.json()
  const supabase = createClient()

  // Business logic mixed with HTTP handling
  const { data: paciente } = await supabase
    .from('pacientes')
    .select()
    .eq('telefone', data.telefone)
    .single()

  if (!paciente) {
    const { data: newPaciente } = await supabase
      .from('pacientes')
      .insert({ nome: data.nome, telefone: data.telefone })
      .select()
      .single()
  }

  const { data: agendamento } = await supabase
    .from('agendamentos')
    .insert({ paciente_id: paciente.id, ... })

  return Response.json(agendamento)
}

// ✅ CORRECT - Business logic separated
// lib/services/agendamentos.ts
export async function criarAgendamento(input: CreateAgendamentoInput) {
  const supabase = createClient()

  const paciente = await findOrCreatePaciente(input.paciente)
  const agendamento = await supabase
    .from('agendamentos')
    .insert({
      paciente_id: paciente.id,
      data_hora: input.data_hora,
      servico_id: input.servico_id,
    })
    .select()
    .single()

  return agendamento
}

// app/api/agendamentos/route.ts
import { criarAgendamento } from '@/lib/services/agendamentos'

export async function POST(request: Request) {
  const data = await request.json()
  const result = await criarAgendamento(data) // Reusable, testable
  return Response.json(result)
}
```

---

### Anti-Pattern 5: Exposing Service Role Key on Client

**What people do:** Use `SUPABASE_SERVICE_ROLE_KEY` in client-side code for "admin" operations

**Why it's wrong:**
- **CRITICAL SECURITY ISSUE**: Service role bypasses RLS and grants full database access
- Exposed in browser = anyone can read/modify/delete any data
- No way to revoke without rotating key for entire project

**Do this instead:**
- Only use service role key in server-side code (API Routes, Server Actions)
- Use RLS policies to grant admin users elevated permissions
- For admin operations, use anon key with proper RLS policies that check user role

**Example:**

```typescript
// ❌ WRONG - Service key on client
'use client'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // EXPOSED TO BROWSER!
)

// ✅ CORRECT - Use RLS for admin access
// Database policy (runs server-side):
CREATE POLICY "Admins can delete any agendamento"
  ON agendamentos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

// Client code uses normal anon key:
'use client'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient() // Uses ANON key
await supabase.from('agendamentos').delete().eq('id', id)
// RLS policy automatically checks if user is admin
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Supabase Auth** | OAuth providers via `signInWithOAuth()` | Configure redirect URLs in Supabase dashboard. Use `/api/auth/callback` route. |
| **Supabase Realtime** | Subscribe in Client Components via `supabase.channel()` | Must enable Realtime on tables in dashboard. Clean up subscriptions on unmount. |
| **N8N Workflows** | Webhook endpoints in `/api/webhooks/n8n/*` | Verify webhook signature. Use server-side Supabase client with RLS. |
| **WhatsApp (Evolution API)** | External webhook → N8N → Supabase | N8N handles Evolution API integration. Frontend displays data via Supabase. |
| **OpenAI** | Server Actions or API Routes only | Never expose API key on client. Use streaming for better UX. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Server ↔ Client** | Props (initial data), API Routes (mutations), Realtime (updates) | Server Components pass initial data as props. Mutations go through Server Actions or API Routes. Real-time for live updates. |
| **App Router ↔ Supabase** | Typed client (`lib/supabase/*`) | Always use appropriate client (browser vs server). Never share server client across requests. |
| **Business Logic ↔ Framework** | Pure functions in `lib/services/*` | Keep domain logic framework-agnostic. Easy to test and reuse. |
| **UI Components ↔ Data Layer** | Custom hooks (`hooks/*`) for real-time, direct queries in Server Components | Encapsulate subscription logic in hooks. Query functions for Server Components. |

## Sources

**Official Documentation (HIGH confidence):**
- [Next.js App Router Documentation](https://nextjs.org/docs/app/building-your-application) - Official Next.js docs
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client) - Official Supabase SSR patterns
- [Supabase Realtime with Next.js](https://supabase.com/docs/guides/realtime/realtime-with-nextjs) - Official real-time integration
- [React Documentation](https://react.dev/reference/react) - Official React hooks and patterns

**Architecture Best Practices (HIGH confidence):**
- [Best Practices for Organizing Your Next.js 15 2025](https://dev.to/bajrayejoon/best-practices-for-organizing-your-nextjs-15-2025-53ji)
- [Modern Full Stack Application Architecture Using Next.js 15+](https://softwaremill.com/modern-full-stack-application-architecture-using-next-js-15/)
- [Architecture and Folder Structure for Next.js SaaS](https://makerkit.dev/docs/next-supabase/architecture/architecture)

**State Management (HIGH confidence):**
- [State Management with Next.js App Router](https://www.pronextjs.dev/tutorials/state-management)
- [React Query as a State Manager in Next.js](https://geekyants.com/blog/react-query-as-a-state-manager-in-nextjs-do-you-still-need-redux-or-zustand)

**Folder Structure (HIGH confidence):**
- [Next.js Project Organization](https://nextjs.org/docs/14/app/building-your-application/routing/colocation)
- [The Ultimate Guide to Organizing Your Next.js 15 Project Structure](https://www.wisp.blog/blog/the-ultimate-guide-to-organizing-your-nextjs-15-project-structure)

**Row Level Security (HIGH confidence):**
- [Supabase RLS Best Practices](https://www.leanware.co/insights/supabase-best-practices)
- [Multi-Tenant Applications with RLS on Supabase](https://dev.to/blackie360/-enforcing-row-level-security-in-supabase-a-deep-dive-into-lockins-multi-tenant-architecture-4hd2)

---
*Architecture research for: Admin Dashboard / Operations Console (Healthcare SaaS)*
*Researched: 2025-01-15*
