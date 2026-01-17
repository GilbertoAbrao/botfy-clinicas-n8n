# Summary: Plan 07-01 - Database Schema for Configuration

**Phase:** 07-system-configuration
**Plan:** 01
**Status:** COMPLETE
**Completed:** 2026-01-17

---

## Objective Achieved

Created Prisma models for Service and ClinicSettings to support system configuration features.

---

## Deliverables

### 1. Service Model

**File:** `prisma/schema.prisma`

```prisma
model Service {
  id        String   @id @default(uuid()) @db.Uuid
  nome      String
  duracao   Int      // Duration in minutes
  preco     Decimal  @db.Decimal(10, 2)
  ativo     Boolean  @default(true)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([nome])
  @@index([ativo])
  @@map("services")
}
```

### 2. ClinicSettings Model

**File:** `prisma/schema.prisma`

```prisma
model ClinicSettings {
  id                      String   @id @default("default")
  businessHours           Json     @map("business_hours")
  lunchBreak              Json     @map("lunch_break")
  antecedenciaMinima      Int      @default(24) @map("antecedencia_minima")
  notificationPreferences Json?    @map("notification_preferences")
  updatedAt               DateTime @updatedAt @map("updated_at")

  @@map("clinic_settings")
}
```

### 3. Migration

**File:** `prisma/migrations/20260117_add_service_and_clinic_settings/migration.sql`

- Creates `clinic_settings` table with singleton pattern
- Creates `services` table with indexes on `nome` and `ativo`

### 4. Seed Script

**File:** `prisma/seed.ts`

Default ClinicSettings:
- Business hours: Mon-Fri 09:00-18:00, Sat-Sun closed
- Lunch break: 12:00-13:00
- Minimum advance booking: 24 hours
- Idempotent upsert (safe to run multiple times)

---

## Verification Checklist

- [x] Service model exists in prisma/schema.prisma
- [x] Service has fields: id, nome, duracao, preco, ativo, createdAt, updatedAt
- [x] Service has index on nome and ativo
- [x] ClinicSettings model exists in prisma/schema.prisma
- [x] ClinicSettings has fields: id, businessHours, lunchBreak, antecedenciaMinima, notificationPreferences, updatedAt
- [x] ClinicSettings uses singleton pattern (id = 'default')
- [x] Migration file exists in prisma/migrations/
- [x] npx prisma generate succeeds
- [x] npm run build compiles without errors
- [x] Default ClinicSettings seed exists

---

## Commits

1. `feat(07-01): add Service and ClinicSettings models to Prisma schema`
2. `feat(07-01): add migration for Service and ClinicSettings tables`
3. `feat(07-01): add seed script for default ClinicSettings`

---

## Notes

- Database migration needs to be applied to Supabase manually or via deployment pipeline
- The migration SQL is ready in `prisma/migrations/20260117_add_service_and_clinic_settings/migration.sql`
- Seed script can be run with `npm run seed` after migration is applied
- This plan provides the foundation for Plan 07-02 (Services CRUD) and Plan 07-04 (Business Hours)

---

## Next Steps

- Apply migration to Supabase database
- Run seed script to create default ClinicSettings
- Proceed to Plan 07-02 (Services CRUD UI) or Plan 07-04 (Business Hours UI)
