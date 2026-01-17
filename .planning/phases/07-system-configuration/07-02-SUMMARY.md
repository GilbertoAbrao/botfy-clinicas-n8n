# Plan 07-02 Summary: Services CRUD

**Status:** Complete
**Executed:** 2026-01-17

---

## Objective Achieved

Implemented full CRUD for clinic services with list, create, edit, activate/deactivate, and delete functionality. Admin-only access via RBAC.

---

## Requirements Completed

- CONF-03: User can view list of services offered
- CONF-04: User can create new service (nome, duracao, preco, ativo/inativo)
- CONF-05: User can edit existing service
- CONF-06: User can activate/deactivate service
- CONF-07: User can delete service

---

## Implementation Details

### Task 1: Services API Endpoints
- Created `GET /api/servicos` with pagination, search by name, and active status filter
- Created `POST /api/servicos` for service creation with name uniqueness check
- Created `GET /api/servicos/[id]` for single service fetch
- Created `PUT /api/servicos/[id]` for service updates with change tracking
- Created `DELETE /api/servicos/[id]` for service deletion with appointment count warning
- All routes require ADMIN role via `checkPermission(role, PERMISSIONS.MANAGE_SYSTEM_CONFIG)`
- All routes include audit logging with VIEW_SERVICE, CREATE_SERVICE, UPDATE_SERVICE, DELETE_SERVICE actions

### Task 2: Zod Validation Schema
- Created `serviceSchema` with validation for:
  - nome: 2-100 characters
  - duracao: 5-480 minutes
  - preco: 0 to 99999.99
  - ativo: boolean (required)
- Added `formatDuration()` helper for "1h 30min" display format
- Added `formatPrice()` helper for "R$ 150,00" currency format

### Task 3: Services List Page
- Created `/admin/servicos` page with DashboardLayout
- Created `ServicesPageClient` for state management (services, modals)
- Created `ServiceTableClient` with:
  - Desktop table view with nome, duracao, preco, status columns
  - Mobile card view for responsive design
  - Empty state with "Criar Servico" CTA
- Created `ServiceSearch` component with:
  - Name search with debounce
  - Active status filter (Todos, Ativos, Inativos)
  - Create button

### Task 4: Service Form Modal
- Created `ServiceFormModal` for create/edit operations
- React Hook Form with Zod resolver for validation
- Fields: nome (text), duracao (number), preco (number), ativo (switch)
- Pre-fills data when editing
- Loading state during save
- Success/error toasts via Sonner
- Name conflict handling (409 response)

### Task 5: Toggle Active and Delete Actions
- Created `ServiceActions` dropdown component
- Toggle active button (switches ativo status via PUT)
- Delete button with AlertDialog confirmation
- Delete shows warning about linked appointments
- Optimistic UI updates via parent refresh callback
- Audit logging for all actions

### Task 6: Navigation Update
- Added "Servicos" link to sidebar navigation
- Uses Package icon from Lucide
- Marked as adminOnly (only shows for ADMIN role)
- Active state when on /admin/servicos

---

## Files Created/Modified

### New Files
- `src/lib/validations/service.ts` - Zod validation schema and formatters
- `src/app/api/servicos/route.ts` - GET list, POST create
- `src/app/api/servicos/[id]/route.ts` - GET single, PUT update, DELETE
- `src/app/admin/servicos/page.tsx` - Services management page
- `src/components/services/service-search.tsx` - Search/filter component
- `src/components/services/service-table-client.tsx` - Table client component
- `src/components/services/service-pagination.tsx` - Pagination controls
- `src/components/services/service-actions.tsx` - Actions dropdown
- `src/components/services/service-form-modal.tsx` - Create/edit modal
- `src/components/services/services-page-client.tsx` - Page state management

### Modified Files
- `src/lib/audit/logger.ts` - Added VIEW_SERVICE, CREATE_SERVICE, UPDATE_SERVICE, DELETE_SERVICE actions
- `src/components/layout/sidebar-nav.tsx` - Added Servicos navigation link
- `src/components/ui/dropdown-menu.tsx` - Added via shadcn/ui

---

## Technical Decisions

1. **Required ativo field**: Made ativo required (not optional with default) to simplify TypeScript types with react-hook-form and zodResolver
2. **Decimal preco**: Stored as Prisma Decimal, displayed with Intl.NumberFormat for currency
3. **Duration format**: Stored as minutes (Int), displayed as "Xh Ymin" via formatDuration helper
4. **Client-side state management**: Used ServicesPageClient for modal state since page needs interactivity
5. **Audit on delete**: Log appointment count when deleting service that was used in appointments

---

## Commits

1. `feat(07-02): add Services CRUD API endpoints and validation` (cd24b68)
   - API routes and validation schema

2. `feat(07-03): add User Management UI and navigation` (229b8f0)
   - Service UI components (committed alongside user management)

---

## Verification

- [x] GET /api/servicos returns service list with pagination
- [x] POST /api/servicos creates service (ADMIN only)
- [x] PUT /api/servicos/[id] updates service (ADMIN only)
- [x] DELETE /api/servicos/[id] deletes service (ADMIN only)
- [x] All API routes have RBAC check (MANAGE_SYSTEM_CONFIG)
- [x] All API routes have audit logging
- [x] /admin/servicos page loads service list
- [x] Service table shows nome, duracao, preco, status
- [x] Search filters services by nome
- [x] Filter switches between all/active/inactive
- [x] Create modal opens and creates new service
- [x] Edit modal opens with pre-filled data and saves changes
- [x] Toggle active button works
- [x] Delete button shows confirmation and deletes
- [x] npm run build compiles without errors
