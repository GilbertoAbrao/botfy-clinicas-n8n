# Plan 01-02 Summary: Supabase Client Configuration

**Phase:** 01-secure-foundation  
**Plan:** 02  
**Status:** ✅ Complete  
**Completed:** 2026-01-15

---

## Objective

Configure Supabase clients (@supabase/ssr) with correct patterns for Browser (singleton), Server (per-request factory), and Middleware (session refresh). Connect to existing Supabase instance.

**Purpose:** Establish secure Supabase integration following official SSR patterns. This is the foundation for authentication, database access, and real-time subscriptions.

**Output:** Working Supabase client factories that follow Next.js 15 App Router + @supabase/ssr best practices.

---

## What Was Built

### 1. Dependencies Installed
- `@supabase/supabase-js@2.90.1` - Supabase JavaScript client
- `@supabase/ssr@0.8.0` - Supabase SSR utilities for Next.js
- `prisma@7.2.0` - Database ORM (dev dependency)
- `@prisma/client@7.2.0` - Prisma client runtime

### 2. Supabase Client Factories

Created three client factories following @supabase/ssr patterns:

**Browser Client (`src/lib/supabase/client.ts`):**
- Singleton pattern for Client Components
- Uses `createBrowserClient` from @supabase/ssr
- Same instance throughout browser session
- ~10 lines of code

**Server Client (`src/lib/supabase/server.ts`):**
- Per-request factory for Server Components, API Routes, and Server Actions
- Uses `createServerClient` with cookie handlers
- Creates NEW client per request for SSR auth
- Cookie management: getAll/setAll with try-catch for Server Component compatibility
- ~30 lines of code

**Middleware Client (`src/lib/supabase/middleware.ts`):**
- Session refresh ONLY (no authorization logic)
- Uses `createServerClient` with Next.js middleware request/response
- Refreshes session tokens automatically
- Returns NextResponse with updated cookies
- ~35 lines of code

### 3. Next.js Middleware

Created `src/middleware.ts`:
- Calls `updateSession` on every request
- Matcher excludes static assets (_next/static, _next/image, favicon, images)
- Ensures session tokens stay fresh without page refresh

**CRITICAL SECURITY PATTERN:**
- Middleware ONLY refreshes sessions (no authorization)
- Per CVE-2025-29927, middleware can be bypassed with x-middleware-subrequest header
- Authorization will be implemented via defense-in-depth:
  - Plan 03: Route-level checks in API routes and Server Actions
  - Plan 05: Row Level Security (RLS) at database level

### 4. Prisma Schema

Created `prisma/schema.prisma` with User model:
- `id`: UUID (Supabase Auth managed)
- `email`: Unique identifier
- `role`: "admin" or "atendente" (default: atendente)
- `createdAt`/`updatedAt`: Timestamp tracking
- Maps to `users` table in database

**Configuration:**
- `prisma.config.ts` configures DATABASE_URL (Prisma 7 pattern)
- Prisma Client generated successfully
- NO database push yet - existing database with N8N tables

### 5. Environment Configuration

**`.env.local` (not committed):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://gkweofpjwzsvlvnvfbom.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[user will provide]
SUPABASE_SERVICE_ROLE_KEY=[user will provide]
DATABASE_URL=postgresql://postgres:[password]@db.gkweofpjwzsvlvnvfbom.supabase.co:5432/postgres
```

**`.env.example` (committed):**
- Template for environment variables
- Shows required configuration without exposing secrets

**`.gitignore`:**
- Already protects `.env*.local` files
- No secrets committed to repository

---

## Verification

✅ **Build succeeds:** `npm run build` completes without errors  
✅ **Dependencies installed:** @supabase/supabase-js and @supabase/ssr verified  
✅ **Three client factories created:** Browser, Server, Middleware  
✅ **Middleware configured:** src/middleware.ts with session refresh  
✅ **Prisma schema created:** User model defined  
✅ **Prisma Client generated:** node_modules/@prisma/client exists  
✅ **Environment files:** .env.local with placeholders, .env.example committed  
✅ **No secrets committed:** .gitignore protects sensitive files  

---

## Key Design Decisions

### 1. Supabase SSR Pattern
- **Decision:** Use @supabase/ssr (NOT @supabase/auth-helpers - deprecated)
- **Rationale:** Official Supabase recommendation for Next.js 13+ App Router
- **Impact:** Modern, supported pattern with active maintenance

### 2. Client Factory Patterns
- **Browser:** Singleton (same instance across components)
- **Server:** Per-request factory (new instance per request)
- **Middleware:** Session refresh only (minimal logic)
- **Rationale:** Follows Next.js 15 best practices and Supabase SSR guide
- **Impact:** Correct cookie handling, SSR compatibility, security

### 3. Security-First Middleware
- **Decision:** Middleware refreshes sessions but does NOT enforce authorization
- **Rationale:** CVE-2025-29927 allows middleware bypass via x-middleware-subrequest header
- **Impact:** Defense-in-depth approach:
  - Middleware: Session refresh
  - Routes: Authorization checks (Plan 03)
  - Database: Row Level Security (Plan 05)

### 4. Existing Database Connection
- **Decision:** NO `prisma db push` - connect to existing Supabase database
- **Rationale:** Database already contains N8N tables (pacientes, agendamentos, chats, etc.)
- **Impact:** Careful schema reconciliation required in Plan 03 to avoid conflicts

### 5. Prisma 7 Configuration
- **Decision:** Use `prisma.config.ts` for datasource URL (not in schema.prisma)
- **Rationale:** Prisma 7 moved connection URLs to config file
- **Impact:** Modern Prisma pattern, better separation of concerns

---

## Files Created/Modified

### Created:
- `src/lib/supabase/client.ts` - Browser client factory
- `src/lib/supabase/server.ts` - Server client factory
- `src/lib/supabase/middleware.ts` - Middleware session refresh
- `src/middleware.ts` - Next.js middleware
- `prisma/schema.prisma` - User model schema
- `prisma.config.ts` - Prisma configuration
- `.env.local` - Environment variables (not committed)
- `.env.example` - Environment template

### Modified:
- `package.json` - Added Supabase and Prisma dependencies
- `.gitignore` - Already protected .env files (no changes needed)

---

## Git Commits

1. **c0c212a** - feat: install Supabase dependencies and configure environment
2. **4388789** - feat: create Supabase client factories
3. **ffa86ee** - feat: configure Next.js middleware for session refresh
4. **0110446** - feat: create Prisma schema with User table for Supabase Auth

---

## User Action Required

After this plan executes, user must:

1. **Get Supabase credentials:**
   - Go to Supabase Dashboard → Project Settings → API
   - Copy `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

2. **Get database password:**
   - Go to Supabase Dashboard → Project Settings → Database
   - Copy database password

3. **Update `.env.local`:**
   ```env
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.gkweofpjwzsvlvnvfbom.supabase.co:5432/postgres
   ```

4. **Verify connection:**
   ```bash
   npx prisma db pull
   ```
   This will introspect the existing database schema and confirm connectivity.

---

## Success Criteria

✅ All tasks completed  
✅ Supabase clients configured following @supabase/ssr patterns  
✅ Browser/Server/Middleware clients follow official SSR guide  
✅ Environment variables configured (placeholders for user secrets)  
✅ Middleware refreshes sessions without authorization logic (CVE-2025-29927 mitigation)  
✅ Prisma schema ready for existing database connection  
✅ Build succeeds without errors  

---

## Next Steps

**Plan 01-03:** Create Login Page and Auth Flow
- Build login/signup UI with shadcn/ui form components
- Implement Supabase Auth email/password authentication
- Create protected route middleware patterns
- Test authentication flow end-to-end

**Dependencies:** Requires user to provide Supabase credentials in `.env.local` before Plan 01-03 can be tested with real authentication.

---

## Issues Encountered

### 1. Prisma 7 Configuration Change
- **Issue:** Prisma 7 moved datasource URL from schema.prisma to prisma.config.ts
- **Resolution:** Updated schema to remove `url` field, used prisma.config.ts instead
- **Learning:** Always check Prisma version compatibility for schema patterns

### 2. Middleware File Convention Deprecation
- **Issue:** Next.js 16 warns that "middleware" file convention is deprecated
- **Resolution:** Warning acknowledged, but middleware still works correctly
- **Future:** May need to migrate to "proxy" pattern in future Next.js versions

---

*Plan completed: 2026-01-15*  
*Execution time: ~15 minutes*  
*All verification criteria met*
