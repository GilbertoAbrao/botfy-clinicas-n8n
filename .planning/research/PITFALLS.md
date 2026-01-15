# Pitfalls Research

**Domain:** Admin Dashboard / Operations Console (Healthcare SaaS)
**Researched:** 2026-01-15
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Supabase Realtime Memory Leaks from Improper Cleanup

**What goes wrong:**
Client-side memory leaks occur when Supabase Realtime subscriptions are not properly cleaned up. The application consumes more memory over time, eventually leading to performance degradation or crashes. WebSocket connections accumulate without being released, event listeners remain active in unmounted components, and data subscriptions continue to receive updates that are no longer needed.

**Why it happens:**
Developers forget to unsubscribe from realtime channels in useEffect cleanup functions, or they don't understand that Supabase only auto-cleans connections 30 seconds after disconnection. The Realtime API's WebSocket-based architecture requires explicit cleanup that many React developers overlook, especially when rapidly prototyping.

**How to avoid:**
Always use cleanup functions in useEffect hooks:

```javascript
useEffect(() => {
  const channel = supabase.channel('room:123')
  channel.subscribe()

  return () => {
    supabase.removeChannel(channel)
    // or channel.unsubscribe()
  }
}, [])
```

Test for memory leaks by monitoring Chrome DevTools Memory profiler during navigation between dashboard views. Implement a centralized subscription manager that tracks active channels and provides cleanup utilities.

**Warning signs:**
- Browser memory usage steadily increases over time
- Application becomes sluggish after 10-15 minutes of use
- Chrome DevTools shows growing number of detached DOM nodes
- WebSocket connection count increases without bound in network tab
- Realtime subscriptions stop receiving updates after extended use

**Phase to address:**
Phase 1 (Foundation) - Establish realtime subscription patterns with mandatory cleanup. Create reusable hooks that enforce proper subscription lifecycle management.

**Sources:**
- [Supabase Realtime Client-Side Memory Leak](https://drdroid.io/stack-diagnosis/supabase-realtime-client-side-memory-leak) - HIGH confidence
- [Supabase Realtime Getting Started](https://supabase.com/docs/guides/realtime/getting_started) - HIGH confidence
- [Managing real-time subscriptions](https://app.studyraid.com/en/read/8395/231602/managing-real-time-subscriptions) - MEDIUM confidence

---

### Pitfall 2: Row Level Security (RLS) Bypass and Performance Issues

**What goes wrong:**
Missing or incorrectly configured RLS policies expose sensitive patient data to unauthorized users. Even with RLS enabled, poorly designed policies can create security vulnerabilities or cause massive performance degradation. Views bypass RLS by default, and using user_metadata in policies creates exploitable security holes since authenticated users can modify this information.

**Why it happens:**
Developers disable RLS during prototyping and forget to enable it before production launch. RLS syntax is complex and non-intuitive, making it easy to write policies that don't actually enforce intended restrictions. The performance impact of RLS is not apparent during development with small datasets but becomes catastrophic at scale when policies evaluate for every row.

**How to avoid:**
- Enable RLS from day one, even in development
- Never use `user_metadata` claims in security policies
- Set `security_invoker = true` on views (Postgres 15+) to respect RLS
- Test policies with multiple user roles and verify unauthorized access fails
- Use IN or ANY operations instead of subqueries in WHERE clauses for performance
- Avoid calling functions directly in RLS policies - they're evaluated per row
- Run EXPLAIN ANALYZE on queries to measure RLS performance impact

For healthcare data, implement defense-in-depth:
1. RLS at database level
2. Additional validation in API routes/Server Actions
3. Audit logging for all PHI access

**Warning signs:**
- Queries that return instantly in development take 5+ seconds in production
- Database CPU usage spikes during simple SELECT operations
- Users can access data they shouldn't through API endpoints
- EXPLAIN ANALYZE shows sequential scans on large tables
- Missing "SECURITY DEFINER" warnings in database logs

**Phase to address:**
Phase 1 (Foundation) - Define and test all RLS policies before building features.
Phase 2 (HIPAA Compliance) - Audit all policies, implement monitoring, add comprehensive testing.

**Sources:**
- [Row-Level Recklessness: Testing Supabase Security](https://www.precursorsecurity.com/security-blog/row-level-recklessness-testing-supabase-security) - HIGH confidence
- [RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) - HIGH confidence
- [Supabase Best Practices | Security](https://www.leanware.co/insights/supabase-best-practices) - HIGH confidence

---

### Pitfall 3: Next.js Middleware Authorization Bypass (CVE-2025-29927)

**What goes wrong:**
Attackers bypass Next.js middleware entirely by adding the `x-middleware-subrequest` header to HTTP requests. Developers implement authorization checks exclusively in middleware, believing this provides comprehensive protection, but the middleware execution model creates false security assumptions. This allows direct access to API routes and Server Actions that were thought to be protected.

**Why it happens:**
The Next.js hybrid architecture (SSR, client components, edge middleware, API routes) creates multiple attack surfaces. Developers assume middleware provides universal protection without understanding that it can be bypassed. The false sense of security leads to omitting server-side authorization checks in individual routes.

**How to avoid:**
- NEVER rely solely on middleware for authorization
- Implement authorization checks in every API route and Server Action
- Validate user permissions on the server side, even if middleware "should have" blocked access
- Use defense-in-depth: middleware + route-level checks + RLS
- For healthcare data, validate HIPAA authorization at multiple layers

Server Action example:
```typescript
export async function getPatientData(patientId: string) {
  // Don't assume middleware validated this
  const user = await getCurrentUser()
  if (!user || !hasPatientAccess(user, patientId)) {
    throw new Error('Unauthorized')
  }

  // Additional RLS protection at database level
  const data = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .single()

  return data
}
```

**Warning signs:**
- Authorization logic exists only in middleware.ts
- API routes don't check user permissions
- Server Actions assume authenticated user context
- No authorization tests for direct API access
- Relying on "if it worked in dev, it's secure" assumption

**Phase to address:**
Phase 1 (Foundation) - Establish authorization patterns with route-level checks.
Phase 2 (RBAC Implementation) - Comprehensive authorization testing across all attack surfaces.

**Sources:**
- [Building a Scalable RBAC System in Next.js](https://medium.com/@muhebollah.diu/building-a-scalable-role-based-access-control-rbac-system-in-next-js-b67b9ecfe5fa) - HIGH confidence
- [Implement RBAC Authorization in Next.js - 2024 Guide](https://www.permit.io/blog/how-to-add-rbac-in-nextjs) - HIGH confidence
- [Auth.js | Role Based Access Control](https://authjs.dev/guides/role-based-access-control) - HIGH confidence

---

### Pitfall 4: Critical React Server Components Deserialization RCE (CVE-2025-55182, CVE-2025-66478)

**What goes wrong:**
Specially crafted HTTP requests exploit insecure deserialization in React Server Components and Next.js Server Actions, allowing unauthenticated remote code execution (RCE) with CVSS 10.0 severity. Even newly generated Next.js applications created with `create-next-app` are immediately vulnerable without any code modifications. Malicious requests can return compiled source code of Server Functions, potentially revealing business logic and exposing secrets if hardcoded.

**Why it happens:**
This is a framework-level vulnerability, not a developer mistake. The vulnerability exists in React 19.0-19.2.0 and requires no special setup or configuration to be exploitable. Default framework configurations are vulnerable under normal use.

**How to avoid:**
- Immediately upgrade to patched versions:
  - React: 19.0.1, 19.1.2, 19.2.1, or later
  - Note: Initial fixes were incomplete; CVE-2025-67779 requires another upgrade
- NEVER hardcode secrets in Server Actions - always use environment variables
- Implement Web Application Firewall (WAF) rules to detect exploitation attempts
- Monitor for suspicious patterns: unusual HTTP requests to Server Action endpoints
- For healthcare applications, this is a HIPAA breach risk if PHI is exposed

**Warning signs:**
- Using React 19.0, 19.1.0, 19.1.1, or 19.2.0
- Not running latest patch versions
- Secrets defined directly in Server Action code
- Lack of WAF protection on production endpoints
- No monitoring for unusual Server Action requests

**Phase to address:**
IMMEDIATE - Check versions and upgrade before any development.
Phase 1 (Foundation) - Establish secret management and environment variable patterns.
Phase 3 (Security Hardening) - Implement WAF and monitoring for exploitation attempts.

**Sources:**
- [Next.js Security Update: December 11, 2025](https://nextjs.org/blog/security-update-2025-12-11) - HIGH confidence
- [Critical Security Vulnerability in React Server Components](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) - HIGH confidence
- [CVE-2025-55182: React2Shell RCE](https://securitylabs.datadoghq.com/articles/cve-2025-55182-react2shell-remote-code-execution-react-server-components/) - HIGH confidence
- [Exploitation of Critical Vulnerability in React Server Components](https://unit42.paloaltonetworks.com/cve-2025-55182-react-and-cve-2025-66478-next/) - HIGH confidence

---

### Pitfall 5: Database Connection Pool Exhaustion

**What goes wrong:**
Improperly configured connection pool settings lead to resource exhaustion and connection errors. Applications crash with "connection pool exhausted" errors even with only 1-2 active users. The problem worsens at scale: if two distinct database clients each have a pool size of 120, they collectively exhaust all 240 available direct connections. When all connections are taken, the n+1 client gets rejected and must constantly poll for availability.

**Why it happens:**
Developers don't understand Supabase's connection model and use direct database connections instead of Supavisor pooler. Supabase transitioned to IPv6-only direct connections in early 2024, breaking many existing applications. Connection leaks occur when applications don't properly close database connections, creating 100+ "zombie" connections.

**How to avoid:**
- Use Supavisor connection pooler, not direct database URLs
- Switch from direct connection strings to pooled connection strings:
  - Direct: `postgresql://[user]:[pass]@db.[project].supabase.co:5432/postgres`
  - Pooled: `postgresql://[user]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres`
- Configure appropriate pool sizes based on your plan limits
- Monitor connection usage in Supabase Dashboard
- Use CLI to identify connection issues: `npx supabase inspect db connections`
- Implement proper connection cleanup in serverless functions
- For IPv6 issues: ensure server/container supports IPv6 or use pooler

**Warning signs:**
- "connection pool exhausted" errors
- Database connection errors with < 10 concurrent users
- Growing number of "idle in transaction" connections
- Supabase dashboard showing 90%+ connection pool usage
- Application works locally but fails in production
- Intermittent database timeouts during normal load

**Phase to address:**
Phase 1 (Foundation) - Configure Supavisor from the start, establish connection patterns.
Phase 4 (Performance Optimization) - Load testing, connection monitoring, autoscaling strategies.

**Sources:**
- [Connection management | Supabase Docs](https://supabase.com/docs/guides/database/connection-management) - HIGH confidence
- [Supavisor FAQ](https://supabase.com/docs/guides/troubleshooting/supavisor-faq-YyP5tI) - HIGH confidence
- [Solving Supabase IPv6 Connection Issues](https://medium.com/@lhc1990/solving-supabase-ipv6-connection-issues-the-complete-developers-guide-96f8481f42c1) - MEDIUM confidence
- [Critical Softr - Supabase connection issue](https://community.softr.io/t/critical-softr-supabase-connection-issue-supabase-pool-exhausted-with-only-1-user/14713) - MEDIUM confidence

---

### Pitfall 6: Missing Database Indexes Causing Query Performance Collapse

**What goes wrong:**
Queries that work fine in development with 100 records become unusable in production with 10,000+ records. Dashboard pages take 30+ seconds to load. Simple patient searches time out. The root cause is missing indexes on frequently queried columns, forcing Postgres to perform sequential scans on entire tables.

**Why it happens:**
Developers prototype without thinking about indexes, and performance issues don't manifest until production data volumes are reached. PostgREST adds minimal overhead (a few milliseconds), so slow queries are almost always database-level problems. RLS policies compound the issue by causing index scans to become sequential scans when poorly designed.

**How to avoid:**
- Use Supabase's Index Advisor (available in Dashboard) to identify missing indexes
- Run `npx supabase inspect db unused-indexes` to find unnecessary indexes
- Use EXPLAIN ANALYZE to profile query performance before deploying
- Create indexes on:
  - Foreign key columns
  - Columns used in WHERE clauses
  - Columns used in JOIN conditions
  - Columns used in ORDER BY
  - Timestamp columns used for date range filtering
- For RLS optimization: ensure policies can utilize indexes

Example for patient conversation logs:
```sql
-- Bad: Sequential scan on 100k records
SELECT * FROM conversation_logs
WHERE patient_id = 'xyz'
ORDER BY created_at DESC
LIMIT 50;

-- Good: Create composite index
CREATE INDEX idx_conversation_logs_patient_created
ON conversation_logs(patient_id, created_at DESC);
```

**Warning signs:**
- Queries taking >100ms in production vs <10ms in development
- EXPLAIN ANALYZE showing "Seq Scan" instead of "Index Scan"
- Database CPU usage spikes during simple queries
- Dashboard becomes unusable with realistic data volumes
- Users complain about "slow search" or "loading forever"

**Phase to address:**
Phase 1 (Foundation) - Index critical query paths (auth, patient lookup).
Phase 4 (Performance Optimization) - Comprehensive index review and optimization.

**Sources:**
- [Debugging performance issues | Supabase Docs](https://supabase.com/docs/guides/database/debugging-performance) - HIGH confidence
- [Steps to improve query performance with indexes](https://supabase.com/docs/guides/troubleshooting/steps-to-improve-query-performance-with-indexes-q8PoC9) - HIGH confidence
- [Best Practices for Supabase | Scaling](https://www.leanware.co/insights/supabase-best-practices) - HIGH confidence

---

### Pitfall 7: Large Table Rendering Without Virtualization

**What goes wrong:**
Rendering 10,000+ rows in a React table component overwhelms the DOM, causing sluggish performance, browser freezing, and excessive memory consumption. The application becomes unusable when viewing conversation history or patient records. Users experience multi-second delays when scrolling or filtering data.

**Why it happens:**
Developers render entire datasets without implementing virtualization. The browser creates DOM nodes for every row, even those not visible in the viewport. This works fine with 50-100 rows but catastrophically fails at healthcare data scales where a single patient might have thousands of conversation logs.

**How to avoid:**
- Use TanStack Virtual or react-window for virtualization
- Only enable virtualization for >50 rows (adds overhead for small datasets)
- Virtual rendering keeps ~35 DOM nodes in memory regardless of total items
- For Material React Table or TanStack Table, enable built-in virtualization
- Implement server-side pagination for 100k+ records (client virtualization has limits)
- Consider infinite scroll with virtual scrolling for best UX

Example with TanStack Table + Virtual:
```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

// Only render visible rows
const rowVirtualizer = useVirtualizer({
  count: data.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50, // row height
  overscan: 5
})
```

**Warning signs:**
- Browser tab becomes unresponsive when loading tables
- Chrome DevTools showing 50,000+ DOM nodes
- Memory usage exceeding 500MB for a single page
- Scroll lag or janky scrolling in data tables
- "This page is slowing down your browser" warnings
- Tables with >1000 rows without pagination or virtualization

**Phase to address:**
Phase 2 (Core Features) - Implement virtualization for conversation logs and patient lists.
Phase 4 (Performance Optimization) - Performance testing with realistic data volumes.

**Sources:**
- [Build Tables in React: Data Grid Performance Guide](https://strapi.io/blog/table-in-react-performance-guide) - HIGH confidence
- [Optimizing Large Data Sets with Virtualized Columns and Rows in React TanStack Table](https://borstch.com/blog/development/optimizing-large-data-sets-with-virtualized-columns-and-rows-in-react-tanstack-table) - HIGH confidence
- [Row Virtualization Example - Material React Table](https://www.material-react-table.com/docs/examples/row-virtualization) - HIGH confidence

---

### Pitfall 8: Supabase Realtime Connection Reliability Issues in Production

**What goes wrong:**
Realtime connections disconnect after 8 seconds in active windows. Connections close when screens lock or apps go to the background. Subscription status changes to "CLOSED" when tabs aren't visible, but connection state remains "open," preventing automatic resubscription. Some developers report abandoning Supabase Realtime entirely for Firebase or Pusher due to these reliability issues.

**Why it happens:**
Browser tab visibility detection, aggressive connection timeouts, and Supabase's default reconnection logic don't handle background tabs well. The service reaches maximum allowed connections or exceeds client-side connection limits. Mobile browsers are particularly aggressive about suspending WebSocket connections to save battery.

**How to avoid:**
- Implement custom reconnection logic that handles visibility changes:
```typescript
useEffect(() => {
  const channel = supabase.channel('alerts')

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      channel.subscribe() // Resubscribe when tab becomes visible
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  channel.subscribe()

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    supabase.removeChannel(channel)
  }
}, [])
```
- Monitor connection status and implement heartbeat/keepalive
- Use Supabase Presence for connection state awareness
- Consider polling fallback for critical alerts when realtime fails
- For admin dashboards: accept that background tabs may need manual refresh
- Test connection recovery after laptop sleep, network changes, tab backgrounding

**Warning signs:**
- Realtime updates stop after a few seconds
- Alerts work only when dashboard tab is focused
- Users report "stale data" until manual refresh
- WebSocket shows "disconnected" in DevTools after brief period
- Connection count grows without bound (indicates failed cleanup + reconnection loops)

**Phase to address:**
Phase 2 (Core Features) - Implement robust realtime connection management.
Phase 3 (Testing & Reliability) - Test reconnection scenarios, implement fallbacks.

**Sources:**
- [Supabase Realtime Troubleshooting](https://supabase.com/docs/guides/realtime/troubleshooting) - HIGH confidence
- [My realtime subscriptions get terminated and I cannot recover them](https://github.com/orgs/supabase/discussions/5312) - HIGH confidence
- [Supabase Realtime Data Inconsistency](https://drdroid.io/stack-diagnosis/supabase-realtime-data-inconsistency) - MEDIUM confidence

---

### Pitfall 9: HIPAA Audit Logging Failures

**What goes wrong:**
Healthcare organizations fail to implement proper audit logging, violating HIPAA requirements and creating liability. A real case: a small clinic had no documentation of ePHI access log audits, and several employees inappropriately accessed patient records without detection. Without audit trails, breaches go unnoticed until it's too late. Small configuration mistakes lead to sensitive data leaks.

**Why it happens:**
Developers treat audit logging as a "nice to have" feature to add later, not realizing it's a legal requirement from day one. Ignorance of HIPAA classification leads to violations - teams don't understand what counts as PHI in intake forms, voicemails, and sign-in sheets. Manual logging increases human error and non-compliance risk.

**How to avoid:**
- Implement audit logging from Phase 1, not as an afterthought
- Track ALL PHI access with who, when, what, and which data:
  - User logins and authentication events
  - All database queries accessing patient data
  - Access control changes (role/permission modifications)
  - Administrator actions
  - Failed access attempts
- Store audit logs for 6 years (HIPAA requirement)
- Logs must be immutable and tamper-proof
- Implement automated logging - don't rely on manual processes
- Use Supabase RLS policies to enforce logging:

```sql
-- Audit trigger for patient access
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  timestamp timestamptz DEFAULT now(),
  ip_address inet,
  details jsonb
);

-- Trigger function for patient table access
CREATE OR REPLACE FUNCTION log_patient_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, table_name, record_id, details)
  VALUES (
    auth.uid(),
    TG_OP,
    'patients',
    NEW.id,
    jsonb_build_object('accessed_fields', NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

- Regular log review process: check for patterns indicating inappropriate access
- Look for repeated views of same patient file or access outside working hours
- Implement dashboard for administrators to audit access patterns

**Warning signs:**
- No audit logging implementation in initial architecture
- Manual or optional logging mechanisms
- Logs stored in mutable tables or with short retention
- No process for regular log review
- Inability to answer "who accessed patient X's data on date Y?"
- Audit logging treated as Phase 3+ feature instead of Phase 1

**Phase to address:**
Phase 1 (Foundation) - Implement comprehensive audit logging before any PHI is stored.
Phase 2 (HIPAA Compliance) - Verify logging completeness, implement review processes, ensure 6-year retention.

**Sources:**
- [HIPAA Audit Logs: Complete Requirements for Healthcare Compliance in 2025](https://www.kiteworks.com/hipaa-compliance/hipaa-audit-log-requirements/) - HIGH confidence
- [HIPAA-compliant observability and security](https://www.datadoghq.com/blog/hipaa-compliant-log-management/) - HIGH confidence
- [Understanding the HIPAA Audit Trail Requirements](https://auditboard.com/blog/hipaa-audit-trail-requirements) - HIGH confidence
- [What Are HIPAA Audit Trail and Audit Log Requirements?](https://compliancy-group.com/hipaa-audit-log-requirements/) - HIGH confidence

---

### Pitfall 10: Next.js App Router Cache Confusion Leading to Stale Data

**What goes wrong:**
Users see outdated information despite just updating data. Fresh links show stale content. The client-side router cache cannot be invalidated programmatically, so users must manually refresh the browser tab to see changes. ISR with s-maxage causes pages to serve stale content for up to 2 days. The stale-while-revalidate pattern shows cached data first, then fetches updates in the background, creating confusing UX.

**Why it happens:**
Next.js App Router has multiple caching layers (Request Cache, Full Route Cache, Router Cache, Data Cache), and developers don't understand which layer is causing stale data. The aggressive caching optimizes performance but sacrifices data freshness by default. Misunderstanding `revalidatePath` and `revalidateTag` leads to ineffective cache invalidation.

**How to avoid:**
- For admin dashboards with real-time data needs, disable aggressive caching:
```typescript
// app/dashboard/patients/page.tsx
export const revalidate = 0 // Disable static caching
export const dynamic = 'force-dynamic' // Always fetch fresh data

// Or per-fetch
const data = await fetch(url, {
  cache: 'no-store', // Don't cache this request
  next: { revalidate: 0 }
})
```

- Use cache tags for granular invalidation:
```typescript
// When fetching
const data = await fetch(url, {
  next: { tags: ['patients', `patient-${id}`] }
})

// When updating
import { revalidateTag } from 'next/cache'
revalidateTag('patients')
revalidateTag(`patient-${id}`)
```

- For ISR: set realistic revalidation times (1 hour, not 1 second)
- Accept that some staleness is inevitable with caching - design UX accordingly
- Show "Last updated" timestamps to manage user expectations
- For critical real-time data (alerts): use client-side fetching with Supabase Realtime

**Warning signs:**
- Users report seeing "old data" after updates
- Dashboard shows different data after browser refresh
- Data updates don't reflect for several minutes/hours
- `revalidatePath` calls have no effect
- Confusion about which caching mechanism is active
- No clear caching strategy documented

**Phase to address:**
Phase 1 (Foundation) - Define caching strategy per route type.
Phase 4 (Performance Optimization) - Balance caching for performance vs. freshness needs.

**Sources:**
- [Deep Dive: Caching and Revalidating](https://github.com/vercel/next.js/discussions/54075) - HIGH confidence
- [Mastering Cache Control and Revalidation in Next.js App Router](https://leapcell.io/blog/mastering-cache-control-and-revalidation-in-next-js-app-router) - MEDIUM confidence
- [Finally Master Next.js's Most Complex Feature - Caching](https://blog.webdevsimplified.com/2024-01/next-js-app-router-cache/) - HIGH confidence

---

### Pitfall 11: State Management Chaos from Mixing Server and Client State

**What goes wrong:**
Developers put everything in global state (Zustand, Redux) without distinguishing between server state (patient data, appointments) and client state (UI toggles, form inputs). This creates race conditions, duplicated requests, flashing loading states, wasted network traffic, and stale data. Using useEffect for data fetching adds unnecessary complexity and error handling.

**Why it happens:**
Lack of clear state boundaries - teams don't have a clear idea of which parts own which pieces of state. The misconception that "state management = global state library" leads to over-engineering. Developers derive state using useEffect unnecessarily instead of calculating during render.

**How to avoid:**
- Use TanStack Query (React Query) for ALL server state
- Use Zustand/Context only for UI state (theme, sidebar open/closed, modal state)
- Never use useState or useEffect for data fetching
- TanStack Query handles caching, retries, background refresh, pagination, stale state automatically

Recommended architecture for admin dashboard:
```typescript
// Server state: TanStack Query
const { data: patients, isLoading } = useQuery({
  queryKey: ['patients', filters],
  queryFn: () => supabase.from('patients').select('*').match(filters)
})

// Client state: Zustand
const useDashboardStore = create((set) => ({
  sidebarOpen: true,
  selectedTab: 'overview',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen }))
}))
```

- Enable TanStack Query DevTools and Zustand DevTools for debugging
- Hydrate queries on the server for Next.js performance
- Set appropriate staleTime and cacheTime based on data freshness needs

**Warning signs:**
- Global state store contains API data
- Multiple sources of truth for same data
- Race conditions between different data fetching mechanisms
- Excessive useEffect hooks for data synchronization
- Manually implementing retry/caching/loading state logic
- Different components showing different versions of same data

**Phase to address:**
Phase 1 (Foundation) - Establish state management patterns before building features.
Phase 4 (Performance Optimization) - Optimize caching strategies and query patterns.

**Sources:**
- [Mastering React State Management at Scale in 2025](https://dev.to/ash_dubai/mastering-react-state-management-at-scale-in-2025-52e8) - HIGH confidence
- [React State Management in 2025: What You Actually Need](https://www.developerway.com/posts/react-state-management-2025) - HIGH confidence
- [Seamless Server State Management in Next.js with TanStack Query](https://leapcell.io/blog/seamless-server-state-management-in-next-js-with-tanstack-query) - HIGH confidence

---

### Pitfall 12: Database Migration Disasters in Production

**What goes wrong:**
Resetting migrations in production causes data loss and downtime. Migration history mismatches between local and remote databases break branching and deployments. Failed migrations leave the database in a partially-applied corrupted state. Long-running migrations lock tables, causing application downtime. Developers blindly "fix forward" after failed migrations without understanding database state.

**Why it happens:**
Testing migrations directly in production instead of staging first. Not understanding that Supabase branching relies on migration files, not schema dumps. Lack of downtime planning for large database upgrades (pg_upgrade operates at ~100MBps). Migration ordering issues due to timestamp conflicts or missing dependencies.

**How to avoid:**
- NEVER reset deployed migrations - always roll forward with new migration files
- Test all migrations in staging environment first
- Check for long-running operations that might lock tables:
```sql
-- Check for locks before migration
SELECT * FROM pg_locks WHERE NOT granted;
```

- Use Supabase migration workflow:
```bash
# Create migration
supabase migration new add_patient_index

# Test locally
supabase db reset

# Deploy to staging first
supabase db push --db-url [staging-url]

# Verify in staging, then production
supabase db push
```

- For failed migrations:
  1. Stop immediately - don't try to fix forward
  2. Check migration logs for constraint violations, missing dependencies, locked tables
  3. Assess database state - what was partially applied?
  4. Manual cleanup if needed, or restore from backup
  5. Fix migration file and test again

- Plan downtime windows for major upgrades:
  - Estimate: database_size_GB / 0.1 = downtime_seconds
  - Example: 50GB database ≈ 500 seconds ≈ 8 minutes downtime

- Use `supabase migration repair` for history mismatches

**Warning signs:**
- No staging environment for testing migrations
- Migrations tested only against empty local database
- No backup strategy before running migrations
- Migration files modified after deployment
- Unclear migration history between environments
- No monitoring during migration execution

**Phase to address:**
Phase 1 (Foundation) - Establish migration workflow and testing process.
Phase 3+ (Every Phase) - Test migrations in staging before every production deployment.

**Sources:**
- [Database Migrations | Supabase Docs](https://supabase.com/docs/guides/deployment/database-migrations) - HIGH confidence
- [Migration History Mismatch - Cannot Create Baseline](https://github.com/orgs/supabase/discussions/40721) - MEDIUM confidence
- [Upgrading | Supabase Docs](https://supabase.com/docs/guides/platform/upgrading) - HIGH confidence

---

### Pitfall 13: WebSocket Alert System Scalability Failures

**What goes wrong:**
Notification systems work perfectly in development but fail silently in production. Background job workers die without alerts or retries. Connection failures due to network issues, timeouts, or server restarts cause alerts to disappear. Message delivery issues from congestion, queuing problems, or server overload create blind spots. Scaling WebSockets requires managing connection state carefully, unlike stateless HTTP APIs.

**Why it happens:**
Lack of monitoring and alerting for the notification system itself. No supervisor processes to keep workers alive. Absence of retry mechanisms for failed notifications. WebSocket architecture requires operational foresight that developers overlook when prototyping with simple implementations.

**How to avoid:**
- Implement comprehensive monitoring and alerting:
  - WebSocket connection health (use Datadog, Prometheus, New Relic)
  - Track session health, latency trends, connection churn
  - Alert on: slow message throughput, handshake failures, high error rates
  - Monitor CPU and memory usage for WebSocket servers

- Use dashboard to visualize notification health
- Implement supervisor processes to restart failed workers:
```typescript
// Worker health check endpoint
app.get('/health', (req, res) => {
  if (websocketServer.clients.size > 0) {
    res.status(200).json({ status: 'healthy' })
  } else {
    res.status(500).json({ status: 'unhealthy' })
  }
})
```

- Track notification status in database for retries:
```sql
CREATE TABLE notification_queue (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  message jsonb NOT NULL,
  status text DEFAULT 'pending', -- pending, sent, failed
  retry_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

- Use message broker (Kafka, Redis) for high-throughput processing
- Implement autoscaling for WebSocket servers based on connection count
- Test connection recovery scenarios: network failures, server restarts, high load

**Warning signs:**
- Notifications stop silently without errors
- No monitoring dashboard for notification system
- Workers fail and don't restart automatically
- No database persistence for notification delivery status
- Alert system has no retries for failures
- Scaling issues appear when >100 concurrent users

**Phase to address:**
Phase 2 (Core Features) - Build notification system with monitoring and retries.
Phase 4 (Performance Optimization) - Load testing, autoscaling, high-availability setup.

**Sources:**
- [Building a Scalable Notification System with Kafka and WebSockets](https://medium.com/@sandeep.ragampudy/building-a-scalable-notification-system-with-kafka-and-websockets-a90ab8e656b9) - MEDIUM confidence
- [WebSocket Application Monitoring: An In-Depth Guide](https://www.dotcom-monitor.com/blog/websocket-monitoring/) - MEDIUM confidence
- [How to scale WebSockets for high-concurrency systems](https://ably.com/topic/the-challenge-of-scaling-websockets) - HIGH confidence

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Disabling RLS during prototyping | Faster development, no policy complexity | Security vulnerabilities, difficult to add later, potential data exposure | NEVER for healthcare data; Early development only if data is fake/non-sensitive |
| Using direct database connections instead of Supavisor | Simpler initial setup, one less thing to configure | Connection pool exhaustion, IPv6 issues, scaling problems | Development only; NEVER in production |
| Skipping indexes during initial development | Faster schema iterations, no index maintenance | Query performance collapse at scale, expensive to add later with large tables | First 1-2 weeks only; Add before real data volume testing |
| Hardcoding secrets in Server Actions | Quick prototyping, no env config needed | RCE vulnerability (CVE-2025-55182), source code exposure | NEVER; Always use environment variables |
| Manual audit logging instead of automated | Seems simpler initially | HIPAA violations, incomplete logs, human error | NEVER for healthcare; Automated from day one |
| Client-side only authorization checks | Faster development, immediate UI feedback | Security bypass via API, HIPAA violations, unauthorized access | NEVER; Always implement server-side checks |
| Not implementing subscription cleanup | Works in development, no immediate issues | Memory leaks, browser crashes, production instability | NEVER; Cleanup is mandatory, not optional |
| Skipping virtualization for tables | Simpler initial implementation | Performance collapse with real data, poor UX at scale | Acceptable for <50 rows; Required for >100 rows |
| Testing migrations only locally | Faster iteration, no staging environment needed | Production data loss, unexpected downtime, corrupted database | Early prototyping only; Staging required before production |
| Ignoring Next.js caching complexity | Simpler mental model, fewer configuration decisions | Stale data, confused users, cache invalidation bugs | NEVER; Understand caching from day one |
| Using global state for server data | Familiar patterns, no new libraries | Race conditions, stale data, complex synchronization | Early prototyping only; Switch to TanStack Query ASAP |
| Skipping HIPAA compliance in Phase 1 | Faster initial development | Cannot launch legally, expensive refactor, potential liability | NEVER; HIPAA from foundation |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Realtime | Not cleaning up subscriptions in useEffect | Always return cleanup function: `return () => supabase.removeChannel(channel)` |
| Supabase Auth | Using `user_metadata` in RLS policies | Use `auth.uid()` and server-validated claims only; Never trust user-modifiable metadata |
| Next.js Server Actions | Relying on middleware for authorization | Implement authorization checks in every Server Action independently |
| PostgREST API | Not using connection pooler (Supavisor) | Always use pooled connection string in production |
| TanStack Query | Mixing server state in Zustand/Redux | Use TanStack Query for ALL server data; Zustand only for UI state |
| Supabase Storage | Not setting RLS policies on storage buckets | Enable RLS on storage and create explicit access policies |
| Next.js App Router | Not understanding caching layers | Learn Request/Route/Router/Data cache; Set explicit revalidation strategies |
| Supabase Migrations | Resetting migrations in production | Never reset; Always create new migration files to roll forward |
| WebSocket Notifications | No reconnection logic for backgrounded tabs | Implement visibility change handlers and manual resubscription |
| Database Queries | Missing indexes on filtered/joined columns | Run Index Advisor before production; Create indexes proactively |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Sequential scans without indexes | Slow queries (>1s response time) | Create indexes on WHERE/JOIN/ORDER BY columns; Use EXPLAIN ANALYZE | >10k rows per table |
| Rendering entire tables without virtualization | Browser freeze, high memory usage | Implement TanStack Virtual for >50 rows | >100 rows rendered simultaneously |
| RLS policies with subqueries | 30+ second query times, CPU spikes | Use IN/ANY instead of subqueries; Avoid function calls in policies | >5k rows accessed in single query |
| Direct database connections at scale | Connection pool exhaustion errors | Use Supavisor pooler from day one | >20 concurrent users |
| Client-side router cache invalidation issues | Stale data after updates | Disable aggressive caching for dynamic data; Use revalidateTag | Any real-time data requirement |
| Accumulating realtime subscriptions | Memory leak, browser crash | Implement cleanup in every useEffect | >10 subscriptions without cleanup |
| N+1 query patterns in Server Components | Page load >5 seconds | Batch queries, use joins, prefetch data | >100 records with relationships |
| Unoptimized images in dashboard | Slow page loads, high bandwidth | Use Next.js Image component with proper sizing | >10 images per page |
| Missing database connection timeout config | Hanging requests, zombie connections | Set reasonable timeout (5-10s); Implement retry logic | First production load spike |
| Expensive RLS policy checks on every row | Database CPU at 100% | Cache policy results; Simplify policy logic; Use materialized views | >1k rows per query |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing service_role key in client code | Complete database access bypass, RLS bypass, data theft | NEVER send service_role to client; Use anon key only |
| Missing RLS on tables with PHI | HIPAA violation, unauthorized patient data access | Enable RLS on ALL tables from day one; Test with multiple user roles |
| Not validating authorization in Server Actions | Middleware bypass attack (CVE-2025-29927) | Implement authorization in every Server Action independently |
| Using user_metadata in security policies | Exploitable by authenticated users modifying their own metadata | Only use server-validated claims in RLS; Validate in backend |
| No audit logging for PHI access | HIPAA violation, breach detection impossible | Log all PHI access with user_id, timestamp, action; Retain 6 years |
| Hardcoded secrets in Server Actions | RCE vulnerability (CVE-2025-55182), source code exposure | Always use environment variables; Never hardcode credentials |
| Views without security_invoker = true | RLS bypass through views (Postgres 15+) | Set security_invoker = true on all views; Test RLS enforcement |
| Missing encryption at rest for PHI | HIPAA violation, data breach liability | Verify Supabase encryption; Sign BAA; Document encryption methods |
| Client-side only role checks | Direct API access bypasses UI checks | Validate roles on server; Implement RBAC at database/API level |
| No rate limiting on auth endpoints | Brute force attacks, credential stuffing (1,740% increase in AI-powered attacks) | Implement rate limiting; Use CAPTCHA; Monitor failed attempts |
| Storing PHI in browser localStorage | XSS vulnerability, HIPAA violation | Store session tokens only; Fetch PHI from server when needed |
| Missing WAF protection | React2Shell RCE (CVE-2025-55182), zero-day exploits | Deploy WAF; Monitor suspicious patterns; Keep frameworks updated |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing stale data without indicators | Users make decisions on outdated information | Show "Last updated: 2m ago" timestamps; Add refresh button |
| Realtime updates that silently stop working | Missed critical alerts, delayed responses | Show connection status indicator; Implement reconnection notifications |
| Loading states that flash for cached data | Jarring UX, appears slow | Use optimistic UI with TanStack Query; Show cached data immediately |
| No feedback when data updates fail | Users assume success, data lost | Show error toasts; Implement optimistic updates with rollback |
| Overwhelming users with all patient data at once | Cognitive overload, slow performance | Implement progressive disclosure; Load data on-demand |
| No indication of HIPAA audit trail | Users unsure if actions are logged | Show "This action is logged" notices; Provide audit trail access |
| Tables without sorting/filtering for large datasets | Users can't find information efficiently | Implement server-side filtering; Add column sorting; Search functionality |
| Alerts that disappear when tab is backgrounded | Missed critical notifications | Implement browser notifications; Show notification history |
| No offline state handling | Confusion when network fails | Show clear "offline" indicators; Queue actions for retry |
| Infinite scroll without "jump to top" | Users lost in long lists, can't return to start | Add "Back to top" button; Consider pagination for admin use cases |
| Generic error messages for security failures | Users don't understand access restrictions | Clear messaging: "You don't have permission to view this patient" |
| No loading skeletons for slow queries | Appears broken, users unsure if loading | Implement skeleton screens; Set expectations for load times |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Authentication:** Often missing proper session management, refresh token handling, and logout cleanup — verify active sessions are tracked and cleaned up
- [ ] **Authorization:** Often missing server-side validation, tested only through UI — verify direct API access fails for unauthorized users
- [ ] **Realtime Subscriptions:** Often missing cleanup functions — verify no memory leaks after navigation between pages
- [ ] **Database Queries:** Often missing indexes — verify EXPLAIN ANALYZE shows index scans, not sequential scans
- [ ] **RLS Policies:** Often missing performance testing — verify policies don't cause >100ms query overhead
- [ ] **Audit Logging:** Often missing comprehensive coverage — verify every PHI access is logged with user context
- [ ] **Error Handling:** Often missing user-friendly messages — verify production errors don't expose stack traces
- [ ] **Table Rendering:** Often missing virtualization for large datasets — verify 1000+ rows render without lag
- [ ] **Caching Strategy:** Often missing explicit configuration — verify Next.js caching behavior matches expectations
- [ ] **State Management:** Often mixing server and client state — verify TanStack Query used for all server data
- [ ] **Connection Pooling:** Often using direct connections — verify Supavisor pooler configured in production
- [ ] **Migration Testing:** Often tested only locally — verify staging environment exists and is used
- [ ] **HIPAA Compliance:** Often postponed to later phases — verify BAA signed, encryption enabled, audit logs working
- [ ] **Security Updates:** Often missed — verify React 19.2.1+, Next.js latest, no CVE-2025-55182 vulnerability
- [ ] **Monitoring & Alerts:** Often missing for critical systems — verify WebSocket health, database performance, error rates monitored

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Memory leak from subscriptions | LOW | Add cleanup functions to useEffect hooks; Test with Chrome DevTools Memory profiler; Deploy hotfix |
| RLS performance collapse | MEDIUM | Add indexes to improve policy performance; Simplify policy logic; Consider materialized views; May require database downtime |
| Missing indexes causing slow queries | LOW-MEDIUM | Run Index Advisor; Create indexes (may take hours on large tables); Monitor index creation progress |
| Connection pool exhaustion | LOW | Switch to Supavisor pooler; Update connection string; Redeploy; Immediate improvement |
| Data exposure from missing RLS | HIGH | Enable RLS immediately; Audit access logs for unauthorized access; Notify affected users; HIPAA breach reporting if PHI exposed |
| Failed database migration | MEDIUM-HIGH | Stop immediately; Review migration logs; Manual cleanup if partially applied; Restore from backup if corrupted; Fix and retest |
| Middleware bypass security hole | MEDIUM | Add server-side authorization checks; Test with direct API calls; Deploy urgently; Audit recent access logs |
| React2Shell RCE vulnerability | CRITICAL | Upgrade React/Next.js immediately; Rotate any hardcoded secrets; Audit server logs for exploitation; Security incident response |
| Missing audit logs for HIPAA | HIGH | Implement logging retroactively; Document gap period; Legal consultation; May require breach notification |
| WebSocket notification failures | MEDIUM | Implement retry queue; Add monitoring; Deploy supervisor processes; Backfill failed notifications from database |
| Stale data from cache issues | LOW | Disable aggressive caching; Use revalidateTag; Add timestamps to UI; Clear guidance for users to refresh |
| State management chaos | MEDIUM-HIGH | Refactor to TanStack Query; Migrate gradually, route by route; Comprehensive testing; Significant dev time |
| Large table rendering freeze | LOW | Add virtualization library; Update components to use virtual scrolling; Test with realistic data; Quick improvement |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Realtime subscription memory leaks | Phase 1 (Foundation) | Chrome DevTools memory profile shows stable memory after 30 min usage |
| RLS bypass and performance issues | Phase 1 (Foundation), Phase 2 (HIPAA) | Test unauthorized access fails; EXPLAIN ANALYZE shows <100ms overhead |
| Middleware authorization bypass | Phase 1 (Foundation) | Direct API calls without middleware fail authorization checks |
| React2Shell RCE vulnerability | IMMEDIATE (Pre-Phase 1) | Verify React 19.2.1+ and Next.js latest installed |
| Connection pool exhaustion | Phase 1 (Foundation) | Load test with 50+ concurrent users shows no connection errors |
| Missing database indexes | Phase 1 (Foundation), Phase 4 (Optimization) | Index Advisor shows no critical missing indexes; Queries <100ms |
| Large table rendering performance | Phase 2 (Core Features) | Render 10,000 rows without browser freeze or lag |
| Realtime connection reliability | Phase 2 (Core Features), Phase 3 (Testing) | Test reconnection after tab backgrounding, network loss, laptop sleep |
| HIPAA audit logging failures | Phase 1 (Foundation), Phase 2 (HIPAA) | All PHI access logged; 6-year retention configured; Regular review process |
| Next.js cache confusion | Phase 1 (Foundation) | Document caching strategy; Test data freshness matches requirements |
| State management chaos | Phase 1 (Foundation) | All server state in TanStack Query; UI state in Zustand; No mixing |
| Database migration disasters | Phase 1 (Foundation), All Phases | Staging environment exists; All migrations tested before production |
| WebSocket alert scalability | Phase 2 (Core Features), Phase 4 (Optimization) | Monitoring dashboard live; Notifications have retry logic; Load tested |

---

## Sources

**Critical Vulnerabilities:**
- [Next.js Security Update: December 11, 2025](https://nextjs.org/blog/security-update-2025-12-11)
- [Critical Security Vulnerability in React Server Components](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components)
- [CVE-2025-55182: React2Shell RCE](https://securitylabs.datadoghq.com/articles/cve-2025-55182-react2shell-remote-code-execution-react-server-components/)
- [Exploitation of Critical Vulnerability in React Server Components](https://unit42.paloaltonetworks.com/cve-2025-55182-react-and-cve-2025-66478-next/)

**Supabase Realtime Issues:**
- [Supabase Realtime Client-Side Memory Leak](https://drdroid.io/stack-diagnosis/supabase-realtime-client-side-memory-leak)
- [Supabase Realtime Troubleshooting](https://supabase.com/docs/guides/realtime/troubleshooting)
- [My realtime subscriptions get terminated and I cannot recover them](https://github.com/orgs/supabase/discussions/5312)
- [Supabase Realtime Data Inconsistency](https://drdroid.io/stack-diagnosis/supabase-realtime-data-inconsistency)

**Security and RLS:**
- [Row-Level Recklessness: Testing Supabase Security](https://www.precursorsecurity.com/security-blog/row-level-recklessness-testing-supabase-security)
- [RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [Best Practices for Supabase | Security](https://www.leanware.co/insights/supabase-best-practices)

**Next.js Authorization:**
- [Building a Scalable RBAC System in Next.js](https://medium.com/@muhebollah.diu/building-a-scalable-role-based-access-control-rbac-system-in-next-js-b67b9ecfe5fa)
- [Implement RBAC Authorization in Next.js - 2024 Guide](https://www.permit.io/blog/how-to-add-rbac-in-nextjs)
- [Auth.js | Role Based Access Control](https://authjs.dev/guides/role-based-access-control)

**Database Performance:**
- [Connection management | Supabase Docs](https://supabase.com/docs/guides/database/connection-management)
- [Supavisor FAQ](https://supabase.com/docs/guides/troubleshooting/supavisor-faq-YyP5tI)
- [Debugging performance issues | Supabase Docs](https://supabase.com/docs/guides/database/debugging-performance)
- [Steps to improve query performance with indexes](https://supabase.com/docs/guides/troubleshooting/steps-to-improve-query-performance-with-indexes-q8PoC9)

**Performance and State Management:**
- [Build Tables in React: Data Grid Performance Guide](https://strapi.io/blog/table-in-react-performance-guide)
- [Optimizing Large Data Sets with Virtualized Columns and Rows in React TanStack Table](https://borstch.com/blog/development/optimizing-large-data-sets-with-virtualized-columns-and-rows-in-react-tanstack-table)
- [Mastering React State Management at Scale in 2025](https://dev.to/ash_dubai/mastering-react-state-management-at-scale-in-2025-52e8)
- [React State Management in 2025: What You Actually Need](https://www.developerway.com/posts/react-state-management-2025)
- [Seamless Server State Management in Next.js with TanStack Query](https://leapcell.io/blog/seamless-server-state-management-in-next-js-with-tanstack-query)

**Caching and Migrations:**
- [Deep Dive: Caching and Revalidating](https://github.com/vercel/next.js/discussions/54075)
- [Finally Master Next.js's Most Complex Feature - Caching](https://blog.webdevsimplified.com/2024-01/next-js-app-router-cache/)
- [Database Migrations | Supabase Docs](https://supabase.com/docs/guides/deployment/database-migrations)
- [Upgrading | Supabase Docs](https://supabase.com/docs/guides/platform/upgrading)

**HIPAA Compliance:**
- [HIPAA Audit Logs: Complete Requirements for Healthcare Compliance in 2025](https://www.kiteworks.com/hipaa-compliance/hipaa-audit-log-requirements/)
- [HIPAA-compliant observability and security](https://www.datadoghq.com/blog/hipaa-compliant-log-management/)
- [Understanding the HIPAA Audit Trail Requirements](https://auditboard.com/blog/hipaa-audit-trail-requirements)
- [What Are HIPAA Audit Trail and Audit Log Requirements?](https://compliancy-group.com/hipaa-audit-log-requirements/)

**WebSocket and Notifications:**
- [Building a Scalable Notification System with Kafka and WebSockets](https://medium.com/@sandeep.ragampudy/building-a-scalable-notification-system-with-kafka-and-websockets-a90ab8e656b9)
- [WebSocket Application Monitoring: An In-Depth Guide](https://www.dotcom-monitor.com/blog/websocket-monitoring/)
- [How to scale WebSockets for high-concurrency systems](https://ably.com/topic/the-challenge-of-scaling-websockets)

---

*Pitfalls research for: Admin Dashboard / Operations Console (Healthcare SaaS)*
*Researched: 2026-01-15*
*Total pitfalls identified: 13 critical, covering realtime subscriptions, security, performance, HIPAA compliance, and production operations*
