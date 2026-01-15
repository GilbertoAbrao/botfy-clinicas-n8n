-- Row Level Security policies for Botfy ClinicOps
-- IMPORTANT: These policies MUST be applied to Supabase database manually
-- Go to Supabase Dashboard → SQL Editor → New Query → Paste this SQL

-- Enable RLS on sensitive tables
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_chat_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_checkin ENABLE ROW LEVEL SECURITY;

-- Pacientes (Patient Data) - Only authenticated users can access
CREATE POLICY "Authenticated users can view patients"
  ON pacientes
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert patients"
  ON pacientes
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update patients"
  ON pacientes
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- DO NOT allow DELETE on patients (soft delete only)
-- Patient records should NEVER be deleted for HIPAA compliance

-- Agendamentos (Appointments) - Authenticated access
CREATE POLICY "Authenticated users can view appointments"
  ON agendamentos
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage appointments"
  ON agendamentos
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Chats - Authenticated access
CREATE POLICY "Authenticated users can view chats"
  ON chats
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage chats"
  ON chats
  FOR ALL
  USING (auth.role() = 'authenticated');

-- N8N Chat Histories - Authenticated access
CREATE POLICY "Authenticated users can view chat histories"
  ON n8n_chat_histories
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage chat histories"
  ON n8n_chat_histories
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Pre Check-in - Authenticated access
CREATE POLICY "Authenticated users can view pre checkin"
  ON pre_checkin
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage pre checkin"
  ON pre_checkin
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Performance optimization: Use IN/ANY instead of subqueries
-- (from Pitfall 2 research)
-- Example for future patient-specific filtering:
-- WHERE patient_id IN (SELECT id FROM allowed_patients WHERE user_id = auth.uid())
