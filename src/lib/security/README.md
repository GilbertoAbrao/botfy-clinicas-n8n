# RLS Policies - Manual Setup Required

Apply these policies in Supabase Dashboard:

1. Go to https://supabase.com/dashboard/project/gkweofpjwzsvlvnvfbom
2. Navigate to SQL Editor
3. Click "New Query"
4. Copy contents of `src/lib/security/rls-policies.sql`
5. Paste and run the query
6. Verify: All tables should show "RLS enabled" in Table Editor

**Why manual?**
- Supabase requires database admin access for RLS
- Cannot be done via Prisma or application code
- Must be done once during initial setup

## Tables Protected by RLS

- `pacientes` - Patient PHI data
- `agendamentos` - Appointment records
- `chats` - Conversation data
- `n8n_chat_histories` - Chat history logs
- `pre_checkin` - Pre-check-in forms

## Security Model

All RLS policies require `auth.role() = 'authenticated'` to prevent anonymous access to PHI.

**IMPORTANT:** Patient records cannot be deleted (HIPAA compliance). Only soft deletes are allowed at application level.
