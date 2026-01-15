# Stack Research

**Domain:** Admin Dashboard / Operations Console (Healthcare SaaS)
**Researched:** 2026-01-15
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.1.8+ | Full-stack React framework with App Router | Industry standard for production dashboards. App Router provides Server Components, Server Actions for data mutations, and built-in optimizations. Official integration with Supabase via @supabase/ssr. |
| TypeScript | 5.x | Type safety | Essential for large dashboards - catches errors at compile time, improves DX with autocomplete, and makes refactoring safer. |
| React | 19.x | UI library | Latest version with improved Server Components support, required for Next.js 15. |
| Tailwind CSS | 4.x | Utility-first CSS framework | Standard for shadcn/ui, enables rapid development with consistent design system. Version 4 offers improved performance. |
| shadcn/ui | Latest | Component library | Industry-leading component system built on Radix UI. Copy-paste approach gives full code ownership, not locked into abstraction. 50+ accessible components including tables, forms, dialogs, calendars. |
| Supabase | Latest | Backend-as-a-Service | Postgres database, real-time subscriptions, authentication, storage. Official SSR support for Next.js via @supabase/ssr package. |

### Supporting Libraries

#### Authentication & Session Management
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/ssr | Latest | Server-side auth for Next.js | **REQUIRED** - Replaces deprecated @supabase/auth-helpers. Handles PKCE flow, cookie-based sessions, automatic token refresh. |
| @supabase/supabase-js | v2.58.0+ | Supabase client | Core client for database, auth, storage, real-time. |

#### Forms & Validation
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | 7.66.0+ | Form state management | **ESSENTIAL** - Performance-focused (minimal re-renders), excellent TypeScript support, works seamlessly with shadcn/ui Form components. |
| @hookform/resolvers | Latest | Validation adapters | Connects Zod schemas to react-hook-form. |
| zod | 3.x | Schema validation | Type-safe validation with TypeScript inference. Standard for Next.js 15 + shadcn/ui forms. |

#### Data Tables
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-table | 8.x | Headless table library | **ESSENTIAL** - Powers shadcn/ui Data Table. Provides sorting, filtering, pagination, column visibility, row selection. Headless = full design control. |
| nuqs | Latest | URL-based state management | For server-side table state (search, filters, pagination in URL). Type-safe alternative to useSearchParams. |

#### Date & Time
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 3.x | Date utilities | **RECOMMENDED** - Used by shadcn/ui Calendar/DatePicker. Better tree-shaking than dayjs. Functional API. |
| react-day-picker | 9.x | Date picker component | **REQUIRED** - Powers shadcn/ui Calendar component. Single/range/multiple date selection. |
| react-big-calendar | Latest | Full calendar/scheduling UI | For appointment scheduling views (week/month views with drag-drop events). Think Google Calendar interface. |

#### Charts & Data Visualization
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| recharts | 2.x | Chart library | **RECOMMENDED** - Powers shadcn/ui Chart components. 53 pre-built chart variants. Not wrapped, so you can upgrade independently. |
| tremor | 3.18.7+ | Dashboard components | **ALTERNATIVE** - 30+ dashboard-focused components including KPI cards, area charts, filter controls. Recently acquired by Vercel. Use if you need comprehensive dashboard toolkit. |

#### Real-time
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/realtime-js | Latest (via supabase-js) | WebSocket subscriptions | For real-time updates (new appointments, status changes). **NOTE:** Must use in Client Components (not Server Components). |

#### Icons & Assets
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | Latest | Icon library | Standard for shadcn/ui. 1000+ consistent icons, tree-shakeable, designed for React. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint | Linting | Configure with next/core-web-vitals + TypeScript rules |
| Prettier | Code formatting | Use with prettier-plugin-tailwindcss for class sorting |
| Radix UI Primitives | Accessible components | Powers shadcn/ui (Dialog, DropdownMenu, etc). Already included via shadcn/ui. |

## Installation

```bash
# Initialize Next.js 15 with TypeScript and Tailwind
npx create-next-app@latest my-admin-dashboard --typescript --tailwind --app --no-src-dir

# Install shadcn/ui (interactive setup)
npx shadcn@latest init

# Core Supabase packages
npm install @supabase/supabase-js @supabase/ssr

# Form handling
npm install react-hook-form @hookform/resolvers zod

# Data tables
npm install @tanstack/react-table

# Date utilities
npm install date-fns react-day-picker

# Charts (choose one or both)
npm install recharts  # If using shadcn/ui charts
npm install @tremor/react  # If using Tremor

# Full calendar (for scheduling views)
npm install react-big-calendar

# Icons
npm install lucide-react

# URL state management (optional but recommended for tables)
npm install nuqs

# Install shadcn/ui components (examples)
npx shadcn@latest add button
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add table
npx shadcn@latest add data-table
npx shadcn@latest add calendar
npx shadcn@latest add date-picker
npx shadcn@latest add chart
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add select
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add toast
npx shadcn@latest add alert
npx shadcn@latest add separator
npx shadcn@latest add tabs

# Dev dependencies
npm install -D @types/react @types/node prettier prettier-plugin-tailwindcss
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 15 | Remix 2.x | If you prefer traditional web fundamentals approach, excellent form handling, or simpler mental model. |
| shadcn/ui | Tremor | If you want a complete dashboard solution out-of-box with less customization work. Good for rapid prototyping. |
| Supabase | Firebase | If you're already in Google Cloud ecosystem or need Firebase's specific features (FCM, ML). |
| Supabase | PlanetScale + Clerk | If you need serverless MySQL or want specialized auth provider. More vendor lock-in. |
| react-hook-form | Formik | If team is already familiar with Formik. react-hook-form has better performance. |
| @tanstack/react-table | AG Grid | For extremely complex enterprise grids with 10,000+ rows and advanced features. Not free for commercial use. |
| recharts | Chart.js | If you need specific chart types not in Recharts or prefer canvas rendering. |
| date-fns | dayjs | If bundle size is critical (dayjs is 2kb vs 13kb) or you're migrating from Moment.js (similar API). |
| react-big-calendar | FullCalendar | If you need premium features like resource scheduling or are willing to pay for commercial license. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| @supabase/auth-helpers | Deprecated as of 2024 | @supabase/ssr - Official replacement with better Next.js 15 support |
| Moment.js | Legacy, huge bundle (67kb), no longer maintained | date-fns (functional, tree-shakeable) or dayjs (smaller, modern) |
| Material-UI (MUI) | Heavy bundle, opinionated styling conflicts with Tailwind | shadcn/ui - Better Tailwind integration, lighter weight |
| Bootstrap | Not React-first, jQuery legacy, poor TypeScript support | shadcn/ui + Tailwind CSS |
| Redux (for forms) | Overkill, performance issues with form state | react-hook-form - Purpose-built for forms |
| React Query v3 | Outdated | TanStack Query v5 (if needed) - But Next.js 15 Server Actions often eliminate need |
| Pages Router | Legacy Next.js architecture | App Router - Future of Next.js, better Server Components support |

## Stack Patterns by Variant

**If building simple CRUD dashboard:**
- Next.js 15 + shadcn/ui + Supabase
- Use Server Components for data fetching
- Use Server Actions for mutations
- Minimal client-side state

**If building real-time monitoring dashboard:**
- Add Client Components for real-time subscriptions
- Use Supabase Realtime for WebSocket updates
- Consider React Query for client-side caching if needed
- Use Tremor for pre-built metric cards

**If building appointment/scheduling system:**
- Add react-big-calendar for calendar views
- Use shadcn/ui DatePicker for single date selection
- Use react-day-picker for multi-date selection
- Implement optimistic updates with Server Actions

**If building data-heavy analytics dashboard:**
- Use shadcn/ui + recharts for charts
- Use @tanstack/react-table with server-side pagination
- Consider nuqs for URL-based filter state
- Use React.Suspense for loading states

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 15.1.8 | React 19.x | Next.js 15 requires React 19 |
| shadcn/ui (latest) | Next.js 15, Tailwind 4, Radix UI | Fully compatible, uses React 19 |
| @supabase/ssr | Next.js 15 App Router | Designed specifically for Next.js SSR |
| react-hook-form 7.66 | React 19 | Fully compatible |
| @tanstack/react-table 8.x | React 19 | Fully compatible |
| recharts 2.x | React 18/19 | Works with both versions |
| tremor 3.18.7 | Next.js 15, Tailwind 3/4 | Recently updated for Next.js 15 |
| date-fns 3.x | All browsers | No React version dependencies |
| react-big-calendar | React 18/19 | Use date-fns or dayjs localizer |

## Architecture Patterns

### Recommended File Structure
```
/app
  /(auth)
    /login
      page.tsx
  /(dashboard)
    /layout.tsx              # Dashboard shell with sidebar
    /page.tsx                # Dashboard home
    /patients
      /page.tsx              # Patient list (Server Component)
      /[id]
        /page.tsx            # Patient detail
    /appointments
      /page.tsx              # Calendar view
      /_components
        /calendar-view.tsx   # Client Component for calendar
    /settings
      /page.tsx
  /api
    /webhooks
      /route.ts
/components
  /ui                        # shadcn/ui components
  /shared                    # Shared business components
/lib
  /supabase
    /server.ts               # Server client
    /client.ts               # Client client
  /utils.ts
/types
  /database.types.ts         # Supabase generated types
```

### Server vs Client Component Strategy

**Use Server Components (default) for:**
- Initial data fetching from Supabase
- Rendering static UI (cards, tables, forms)
- SEO-important pages
- Cost optimization (less client JS)

**Use Client Components ("use client") for:**
- Real-time Supabase subscriptions
- Interactive charts (recharts)
- Complex forms with dynamic validation
- Calendar interfaces (react-big-calendar)
- Components with useState, useEffect, event handlers

### Form Handling Pattern (Next.js 15 + Supabase)

```tsx
// app/patients/create/page.tsx (Server Component)
import { CreatePatientForm } from './_components/create-patient-form'

export default function CreatePatientPage() {
  return <CreatePatientForm />
}

// _components/create-patient-form.tsx (Client Component)
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createPatient } from '../actions'

const patientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido'),
})

type PatientFormData = z.infer<typeof patientSchema>

export function CreatePatientForm() {
  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  })

  async function onSubmit(data: PatientFormData) {
    await createPatient(data)
    form.reset()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* More fields... */}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </Form>
  )
}

// actions.ts (Server Action)
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPatient(data: PatientFormData) {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('patients')
    .insert(data)

  if (error) throw error

  revalidatePath('/patients')
}
```

### Real-time Subscription Pattern

```tsx
// _components/appointment-monitor.tsx (Client Component)
'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import type { Appointment } from '@/types/database.types'

export function AppointmentMonitor() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const supabase = createBrowserClient()

  useEffect(() => {
    // Subscribe to real-time changes
    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAppointments(prev => [...prev, payload.new as Appointment])
          }
          // Handle UPDATE, DELETE...
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <div className="space-y-2">
      {appointments.map(apt => (
        <AppointmentCard key={apt.id} appointment={apt} />
      ))}
    </div>
  )
}
```

### Supabase Client Setup (Next.js 15 + @supabase/ssr)

```ts
// lib/supabase/server.ts
import { createServerClient as createClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerClient() {
  const cookieStore = await cookies()

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component
          }
        },
      },
    }
  )
}

// lib/supabase/client.ts
import { createBrowserClient as createClient } from '@supabase/ssr'

export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

## Key shadcn/ui Components for Admin Dashboards

### Essential Components
- **Button** - Primary actions
- **Input, Textarea, Select** - Form fields
- **Form** - Form wrapper with react-hook-form integration
- **Card** - Content containers, metric cards
- **Table** - Basic table structure
- **Data Table** - Advanced tables with TanStack Table
- **Dialog** - Modals, confirmations
- **Dropdown Menu** - Action menus
- **Toast** - Notifications
- **Alert** - Warning/error messages
- **Badge** - Status indicators
- **Tabs** - Content organization
- **Separator** - Visual dividers

### Advanced Components
- **Calendar** - Date selection
- **Date Picker** - Date input with calendar
- **Chart** - Recharts integration (53 variants)
- **Command** - Command palette (Cmd+K)
- **Popover** - Floating content
- **Sheet** - Side panels
- **Skeleton** - Loading states
- **Scroll Area** - Custom scrollbars
- **Combobox** - Searchable select
- **Multi-select** - Multiple selections

### Layout Components
- **Sidebar** - Navigation sidebar (new in v2)
- **Breadcrumb** - Navigation path
- **Pagination** - Page controls
- **Progress** - Progress indicators

## Supabase Real-time Capabilities

### What You Can Subscribe To
1. **Database Changes** (postgres_changes)
   - Listen to INSERT, UPDATE, DELETE on any table
   - Filter by specific columns/values
   - Receive old and new row data

2. **Broadcast** (broadcast)
   - Send/receive arbitrary messages between clients
   - Good for cursor positions, typing indicators

3. **Presence** (presence)
   - Track who's online
   - Share user state across clients

### Enabling Real-time
```sql
-- Enable real-time for a table
alter table appointments replica identity full;

-- In Supabase dashboard:
-- Database → Replication → Enable realtime for tables
```

### Real-time Pricing Note
- Free tier: 200 concurrent connections, 2GB data transfer
- For production dashboards, monitor connection count
- Use presence channels efficiently

## Performance Optimization

### Next.js 15 Specific
- Use Server Components by default (less client JS)
- Use `loading.tsx` for instant loading states
- Use `error.tsx` for error boundaries
- Use React Suspense for streaming
- Use `generateStaticParams` for static pages

### Supabase Specific
- Use Row Level Security (RLS) policies
- Create indexes on frequently queried columns
- Use `select()` to fetch only needed columns
- Use `single()` for single row queries
- Use `.range()` for pagination

### shadcn/ui Specific
- Import components individually (already tree-shakeable)
- Use `React.lazy()` for heavy components like Calendar
- Use `loading="lazy"` for charts that render below fold

## Security Best Practices

### Supabase
- **Enable Row Level Security (RLS)** on all tables
- Never expose service_role key in client code
- Use anon key for client-side operations
- Validate all Server Actions inputs with Zod
- Use Server Actions for sensitive mutations

### Next.js 15
- Use Server Actions for data mutations (no API routes needed)
- Validate user authorization in Server Actions
- Use middleware for route protection
- Set proper CORS headers if using API routes

### Example RLS Policy
```sql
-- Only users can see their own appointments
create policy "Users can view own appointments"
  on appointments for select
  using (auth.uid() = user_id);

-- Only authenticated users can create appointments
create policy "Authenticated users can create appointments"
  on appointments for insert
  with check (auth.role() = 'authenticated');
```

## Deployment Considerations (EasyPanel)

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # Only for server-side
DATABASE_URL=postgresql://... # If using direct connections
```

### Build Configuration
```json
// package.json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "dev": "next dev"
  },
  "engines": {
    "node": ">=18.17.0"
  }
}
```

### Docker (EasyPanel)
```dockerfile
FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]
```

## Sources

### Context7 Documentation
- `/vercel/next.js/v15.1.8` — Next.js 15 Server Components, Server Actions, App Router patterns
- `/websites/supabase` — Supabase real-time subscriptions, authentication, database operations
- `/websites/ui_shadcn` — shadcn/ui component library, charts, calendars, forms, tables
- `/react-hook-form/react-hook-form/v7.66.0` — React Hook Form with Zod validation

### Official Documentation (HIGH Confidence)
- [Next.js Documentation](https://nextjs.org/docs) — App Router, Server Components, Server Actions
- [shadcn/ui Documentation](https://ui.shadcn.com) — Component installation and usage
- [Supabase Documentation](https://supabase.com/docs) — SSR auth, real-time, database
- [Setting up Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) — @supabase/ssr setup
- [Creating a Supabase client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — Client creation patterns

### Community Resources (MEDIUM-HIGH Confidence)
- [Next.js & shadcn/ui Admin Dashboard Template](https://vercel.com/templates/next.js/next-js-and-shadcn-ui-admin-dashboard) — Official Vercel template
- [Mastering Form Handling in Next.js 15](https://medium.com/@sankalpa115/mastering-form-handling-in-next-js-15-with-server-actions-react-hook-form-react-query-and-shadcn-108f6863200f) — Server Actions + react-hook-form + Zod
- [Type-Safe Tables with TanStack Table](https://medium.com/@hpeide/type-safe-tables-eliminating-prop-drilling-with-tanstack-table-react-context-and-shadcn-ui-53a0f7325482) — December 2025 article
- [Building Real-time Magic: Supabase Subscriptions in Next.js 15](https://dev.to/lra8dev/building-real-time-magic-supabase-subscriptions-in-nextjs-15-2kmp) — Real-time patterns
- [React calendar components: 6 best libraries for 2025](https://www.builder.io/blog/best-react-calendar-component-ai) — Calendar library comparison
- [Top 5 Data Visualization Libraries 2025](https://dev.to/burcs/top-5-data-visualization-libraries-you-should-know-in-2025-21k9) — Chart library comparison
- [Date fns vs. Dayjs](https://www.dhiwise.com/post/date-fns-vs-dayjs-the-battle-of-javascript-date-libraries) — Date library comparison
- [shadcn/ui Data Table Documentation](https://ui.shadcn.com/docs/components/data-table) — TanStack Table integration
- [shadcn/ui Form Documentation](https://ui.shadcn.com/docs/components/form) — React Hook Form integration
- [react-big-calendar GitHub](https://github.com/jquense/react-big-calendar) — Scheduling calendar

### GitHub Discussions (MEDIUM Confidence)
- [Supabase Real-Time with Next.js 15 Server Components](https://github.com/orgs/supabase/discussions/30238) — Community discussion on patterns
- [shadcn/ui date-fns vs dayjs discussion](https://github.com/shadcn-ui/ui/discussions/4817) — Library choice discussion

---
*Stack research for: Healthcare SaaS Admin Dashboard*
*Researched: 2026-01-15*
*Focus: Next.js 15 + shadcn/ui + Supabase + TypeScript*
