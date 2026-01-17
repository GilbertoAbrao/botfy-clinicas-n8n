# Plan 07-04 Summary: Business Hours & Notification Preferences

**Phase:** 07-system-configuration
**Plan:** 04
**Status:** COMPLETE
**Completed:** 2026-01-17

---

## Objective

Configure clinic business hours, lunch breaks, booking lead time, and notification preferences through a single settings page for all global configuration.

---

## Completed Tasks

### Task 1: Create Settings API Endpoint
- Created `/api/configuracoes/route.ts` with GET and PUT handlers
- GET returns current ClinicSettings (creates default if not exists)
- PUT updates settings with partial update support
- ADMIN-only access via RBAC (MANAGE_SYSTEM_CONFIG permission)
- Audit logging for all changes with before/after values
- Zod validation for all input data

### Task 2: Create Zod Validation Schema
- Created `/lib/validations/clinic-settings.ts` with comprehensive schemas
- `businessHoursSchema` - validates day objects with open/close times (HH:mm format)
- `lunchBreakSchema` - validates start/end times with duration constraints (30min-3h)
- `antecedenciaMinima` - validates number (1-168 hours)
- `notificationPreferencesSchema` - validates boolean flags
- Helper functions: `generateTimeOptions()`, `DAY_NAMES` mapping
- Default values and presets for form initialization

### Task 3: Create Settings Page Layout
- Created `/admin/configuracoes/page.tsx` with sectioned layout
- 4 sections: Horario de Funcionamento, Horario de Almoco, Preferencias de Agendamento, Notificacoes
- Server component that loads current settings from database
- Clear section headers with descriptions using Card components

### Task 4: Create Business Hours Form
- Created `/components/settings/business-hours-form.tsx`
- Shows all 7 days of week with checkboxes for open/closed
- Each day has open time and close time Select inputs
- Time inputs with 30-min increments (00:00 to 23:30)
- Disabled times when day is closed
- "Copiar para dias uteis" helper button
- Save button with loading state
- Client-side validation: close time must be after open time

### Task 5: Create Lunch Break Form
- Created `/components/settings/lunch-break-form.tsx`
- Start time and end time Select inputs
- "Sem horario de almoco" checkbox to disable lunch break
- Validation: reasonable duration (30min-3h)
- Save button with loading state

### Task 6: Create Booking Settings Form
- Created `/components/settings/booking-settings-form.tsx`
- Number input for antecedencia minima (hours)
- Helper text explaining setting
- Presets: 24h (1 dia), 48h (2 dias), 72h (3 dias)
- Save button with loading state

### Task 7: Create Notification Preferences Form
- Created `/components/settings/notification-preferences-form.tsx`
- Toggle switches for notification types:
  - Alerta de conversa travada
  - Alerta de no-show
  - Resumo diario por email
- Info alert noting notifications are sent via N8N workflows
- Save button with loading state

### Task 8: Update Navigation
- Updated `/components/layout/sidebar-nav.tsx`
- Enabled "Configuracoes" link pointing to /admin/configuracoes
- Route protected by admin layout RBAC

---

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/validations/clinic-settings.ts` | Zod schemas for settings validation |
| `src/app/api/configuracoes/route.ts` | API endpoints for settings CRUD |
| `src/app/admin/configuracoes/page.tsx` | Settings page layout |
| `src/components/settings/business-hours-form.tsx` | Business hours configuration form |
| `src/components/settings/lunch-break-form.tsx` | Lunch break configuration form |
| `src/components/settings/booking-settings-form.tsx` | Booking lead time form |
| `src/components/settings/notification-preferences-form.tsx` | Notification preferences form |

---

## Files Modified

| File | Change |
|------|--------|
| `src/lib/audit/logger.ts` | Added UPDATE_SETTINGS action to AuditAction enum |
| `src/components/layout/sidebar-nav.tsx` | Enabled Configuracoes navigation link |

---

## shadcn/ui Components Added

- `checkbox.tsx` - For day open/closed toggles
- `switch.tsx` - For notification toggles
- `alert.tsx` - For info alerts in forms

---

## Commits

1. `feat(07-04): add Zod validation schema for clinic settings`
2. `feat(07-04): add UPDATE_SETTINGS audit action for settings changes`
3. `feat(07-04): add Settings API endpoint (GET/PUT /api/configuracoes)`
4. `feat(07-04): add settings page and form components`
5. `feat(07-04): enable Configuracoes navigation link`

---

## Requirements Covered

- [x] CONF-01: User can configure business hours (days of week, opening/closing times)
- [x] CONF-02: User can configure lunch break hours
- [x] CONF-08: User can configure antecedencia minima for appointments
- [x] CONF-14: User can configure notification preferences

---

## Verification Checklist

- [x] GET /api/configuracoes returns current settings (creates default if needed)
- [x] PUT /api/configuracoes updates settings (ADMIN only)
- [x] API has RBAC check (MANAGE_SYSTEM_CONFIG)
- [x] API has audit logging
- [x] /admin/configuracoes page loads with current settings
- [x] Business hours form shows all 7 days with open/close times
- [x] Business hours validates close > open
- [x] Lunch break form works with optional "no lunch" option
- [x] Antecedencia minima form accepts hours input
- [x] Notification preferences form has toggle switches
- [x] All forms have save buttons with loading states
- [x] All forms show success toast on save
- [x] npm run build compiles without errors

---

## Notes

- Settings use singleton pattern (id='default' in ClinicSettings table)
- Business hours stored as JSON for flexibility per day
- Calendar system (Phase 4) can reference these settings for availability validation
- N8N workflows can query these settings for notification timing
- All forms save independently to allow partial updates
