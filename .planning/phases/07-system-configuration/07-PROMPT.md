# Phase 07: System Configuration

**Status:** Planned
**Wave Structure:** 2 waves
**Plans:** 4 total

---

## Phase Overview

Enable clinic staff to configure business rules without touching N8N workflows. This phase adds admin-only configuration pages for services, users, business hours, and notification preferences.

---

## Wave Execution

### Wave 1 (Sequential - Foundation)

| Plan | Name | Dependencies | Scope |
|------|------|--------------|-------|
| 07-01 | Database Schema | None | Small |

**Execute:** `07-01` must complete before Wave 2 starts.

### Wave 2 (Parallel)

| Plan | Name | Dependencies | Scope |
|------|------|--------------|-------|
| 07-02 | Services CRUD | 07-01 | Medium |
| 07-03 | User Management | 07-01 | Medium |
| 07-04 | Business Hours & Notifications | 07-01 | Medium |

**Execute:** All three plans can run in parallel after Wave 1 completes.

---

## Requirements Coverage

| Requirement | Plan | Description |
|-------------|------|-------------|
| CONF-01 | 07-04 | Configure business hours |
| CONF-02 | 07-04 | Configure lunch break |
| CONF-03 | 07-02 | View services list |
| CONF-04 | 07-02 | Create service |
| CONF-05 | 07-02 | Edit service |
| CONF-06 | 07-02 | Activate/deactivate service |
| CONF-07 | 07-02 | Delete service |
| CONF-08 | 07-04 | Configure antecedência mínima |
| CONF-09 | 07-03 | View users list |
| CONF-10 | 07-03 | Create user |
| CONF-11 | 07-03 | Edit user |
| CONF-12 | 07-03 | Deactivate user |
| CONF-13 | 07-03 | Assign roles |
| CONF-14 | 07-04 | Configure notification preferences |

---

## New Models

### Service Model (07-01)
```prisma
model Service {
  id        String   @id @default(uuid()) @db.Uuid
  nome      String
  duracao   Int      // minutes
  preco     Decimal  @db.Decimal(10, 2)
  ativo     Boolean  @default(true)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([nome])
  @@index([ativo])
  @@map("services")
}
```

### ClinicSettings Model (07-01)
```prisma
model ClinicSettings {
  id                      String   @id @default("default")
  businessHours           Json     // { monday: { open, close, closed }, ... }
  lunchBreak              Json     // { start, end, disabled }
  antecedenciaMinima      Int      @default(24) // hours
  notificationPreferences Json     @default("{}")
  updatedAt               DateTime @updatedAt @map("updated_at")

  @@map("clinic_settings")
}
```

### User Model Update (07-03)
```prisma
// Add to existing User model:
ativo Boolean @default(true)
```

---

## New API Endpoints

| Method | Endpoint | Plan | Description |
|--------|----------|------|-------------|
| GET | /api/servicos | 07-02 | List services |
| POST | /api/servicos | 07-02 | Create service |
| GET | /api/servicos/[id] | 07-02 | Get service |
| PUT | /api/servicos/[id] | 07-02 | Update service |
| DELETE | /api/servicos/[id] | 07-02 | Delete service |
| GET | /api/usuarios | 07-03 | List users |
| POST | /api/usuarios | 07-03 | Create user |
| GET | /api/usuarios/[id] | 07-03 | Get user |
| PUT | /api/usuarios/[id] | 07-03 | Update user |
| PATCH | /api/usuarios/[id] | 07-03 | Toggle user active |
| GET | /api/configuracoes | 07-04 | Get settings |
| PUT | /api/configuracoes | 07-04 | Update settings |

---

## New Pages

| Route | Plan | Description |
|-------|------|-------------|
| /admin/servicos | 07-02 | Services management |
| /admin/usuarios | 07-03 | User management |
| /admin/configuracoes | 07-04 | Clinic settings |

---

## New Audit Actions

Add to `src/lib/audit/logger.ts`:
- CREATE_SERVICE
- UPDATE_SERVICE
- DELETE_SERVICE
- CREATE_USER
- UPDATE_USER
- DEACTIVATE_USER
- UPDATE_SETTINGS

---

## Key Patterns

1. **Admin-only access**: All routes use `/admin/` prefix and requireRole(ADMIN)
2. **RBAC permissions**: MANAGE_SYSTEM_CONFIG for settings, MANAGE_USERS for users
3. **Singleton pattern**: ClinicSettings uses id='default' for single-row design
4. **Soft delete**: Users are deactivated, not deleted (preserve audit trail)
5. **Audit logging**: All configuration changes logged for HIPAA compliance

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Changing business hours with existing appointments | Warning dialog showing affected appointments |
| Deleting services with existing appointments | Soft delete or prevent with warning |
| Admin locking themselves out | Cannot deactivate own account, cannot change own role |
| User creation via Supabase Auth failures | Clear error messages, retry logic |

---

## Success Criteria (from ROADMAP.md)

1. ✓ Admin configures business hours (Mon-Fri 9am-6pm, lunch 12-1pm) and settings save
2. ✓ Admin creates new service "Botox" with 60min duration and R$500 price
3. ✓ Admin deactivates "Limpeza de Pele" service and it no longer appears in booking flow
4. ✓ Admin creates new Atendente user and user can log in with generated credentials
5. ✓ Admin changes notification preferences and system respects new settings

---

*Phase planned: 2026-01-17*
