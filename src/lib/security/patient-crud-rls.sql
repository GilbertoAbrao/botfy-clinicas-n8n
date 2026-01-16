-- Patient CRUD RLS Policies (Plan 03-03)
-- IMPORTANT: Apply these policies via Supabase SQL Editor
-- These policies replace the basic authenticated policies from Phase 1
-- with role-specific policies for ADMIN and ATENDENTE only

-- First, drop the basic policies from Phase 1
DROP POLICY IF EXISTS "Authenticated users can insert patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can update patients" ON patients;

-- Create role-specific INSERT policy
-- Only ADMIN and ATENDENTE can create patients
CREATE POLICY "ADMIN and ATENDENTE can create patients"
  ON patients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role')::text IN ('ADMIN', 'ATENDENTE')
  );

-- Create role-specific UPDATE policy
-- Only ADMIN and ATENDENTE can update patients
CREATE POLICY "ADMIN and ATENDENTE can update patients"
  ON patients
  FOR UPDATE
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role')::text IN ('ADMIN', 'ATENDENTE')
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role')::text IN ('ADMIN', 'ATENDENTE')
  );

-- Note: SELECT policy remains as-is from Phase 1 (all authenticated users can view)
-- This allows future read-only roles (like VIEWER) to see patient data
-- but only ADMIN and ATENDENTE can create/update

-- DELETE is NOT allowed (HIPAA compliance - use soft delete instead)
-- Patient records should NEVER be deleted for HIPAA compliance
