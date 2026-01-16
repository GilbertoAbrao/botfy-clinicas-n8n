-- Row Level Security Policies for Phase 2: Alert Dashboard
-- These policies protect PHI (Protected Health Information) per HIPAA requirements
-- Apply these manually via Supabase SQL Editor

-- ============================================================================
-- PATIENTS TABLE - PHI
-- ============================================================================

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users (ADMIN and ATENDENTE) can view all patients
CREATE POLICY "Authenticated users can view patients"
ON patients FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'ATENDENTE')
  )
);

-- Policy: Authenticated users (ADMIN and ATENDENTE) can insert patients
CREATE POLICY "Authenticated users can insert patients"
ON patients FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'ATENDENTE')
  )
);

-- Policy: Authenticated users (ADMIN and ATENDENTE) can update patients
CREATE POLICY "Authenticated users can update patients"
ON patients FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'ATENDENTE')
  )
);

-- Policy: Only ADMIN can delete patients
CREATE POLICY "Only admins can delete patients"
ON patients FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN'
  )
);

-- ============================================================================
-- APPOINTMENTS TABLE - PHI
-- ============================================================================

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view all appointments
CREATE POLICY "Authenticated users can view appointments"
ON appointments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'ATENDENTE')
  )
);

-- Policy: Authenticated users can insert appointments
CREATE POLICY "Authenticated users can insert appointments"
ON appointments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'ATENDENTE')
  )
);

-- Policy: Authenticated users can update appointments
CREATE POLICY "Authenticated users can update appointments"
ON appointments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'ATENDENTE')
  )
);

-- Policy: Only ADMIN can delete appointments
CREATE POLICY "Only admins can delete appointments"
ON appointments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN'
  )
);

-- ============================================================================
-- CONVERSATIONS TABLE - PHI
-- ============================================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view all conversations
CREATE POLICY "Authenticated users can view conversations"
ON conversations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'ATENDENTE')
  )
);

-- Policy: Authenticated users can insert conversations (from N8N webhooks via service role)
CREATE POLICY "Authenticated users can insert conversations"
ON conversations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'ATENDENTE')
  )
);

-- Policy: Authenticated users can update conversations (for status changes)
CREATE POLICY "Authenticated users can update conversations"
ON conversations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'ATENDENTE')
  )
);

-- Policy: Only ADMIN can delete conversations
CREATE POLICY "Only admins can delete conversations"
ON conversations FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN'
  )
);

-- ============================================================================
-- ALERTS TABLE
-- ============================================================================

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view all alerts
CREATE POLICY "Authenticated users can view alerts"
ON alerts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'ATENDENTE')
  )
);

-- Policy: Authenticated users can update alert status
CREATE POLICY "Authenticated users can update alerts"
ON alerts FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'ATENDENTE')
  )
);

-- Note: Alert INSERT policy deferred to Phase 6 (One-Click Interventions)
-- Alerts will be created by N8N webhooks using service role key
-- Service role bypasses RLS, so no INSERT policy needed yet

-- Policy: Only ADMIN can delete alerts (for data cleanup)
CREATE POLICY "Only admins can delete alerts"
ON alerts FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN'
  )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test RLS policies (run as Atendente user):
-- SELECT * FROM patients LIMIT 1;  -- Should succeed
-- DELETE FROM patients WHERE id = '<some-id>';  -- Should fail

-- Test RLS policies (run as Admin user):
-- SELECT * FROM patients LIMIT 1;  -- Should succeed
-- DELETE FROM patients WHERE id = '<some-id>';  -- Should succeed (but don't actually delete!)
