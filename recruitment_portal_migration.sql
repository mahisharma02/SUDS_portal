-- ============================================================
-- Smart Dhalao System — Recruitment Portal Migration
-- Run ONCE in Supabase SQL Editor
-- ============================================================

-- 1. Create driver_applications table
CREATE TABLE IF NOT EXISTS driver_applications (
  id                      UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name               TEXT         NOT NULL,
  email                   TEXT         NOT NULL UNIQUE,
  phone                   TEXT         NOT NULL,
  date_of_birth           DATE,
  address                 TEXT,
  aadhaar_number          TEXT,
  licence_number          TEXT         NOT NULL,
  licence_expiry          DATE,
  vehicle_type            TEXT         DEFAULT 'Auto/Mini Truck',
  years_experience        INT          DEFAULT 0,
  emergency_contact_name  TEXT,
  emergency_contact_phone TEXT,
  -- Document URLs (Supabase Storage)
  photo_url               TEXT,
  aadhaar_url             TEXT,
  licence_url             TEXT,
  police_verification_url TEXT,
  address_proof_url       TEXT,
  -- Status
  application_status      TEXT         DEFAULT 'pending', -- pending, approved, rejected
  rejection_remarks       TEXT,
  -- Approval metadata
  approved_by             TEXT,
  approved_at             TIMESTAMPTZ,
  driver_id               UUID         REFERENCES drivers(id) ON DELETE SET NULL,
  generated_driver_code   TEXT,        -- e.g. MCD-2024-0042
  -- Timestamps
  submitted_at            TIMESTAMPTZ  DEFAULT NOW(),
  updated_at              TIMESTAMPTZ  DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE driver_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to INSERT (public application form — no login required)
DROP POLICY IF EXISTS "public_can_apply" ON driver_applications;
CREATE POLICY "public_can_apply" ON driver_applications
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow authenticated officers to read and update
DROP POLICY IF EXISTS "officers_can_read" ON driver_applications;
CREATE POLICY "officers_can_read" ON driver_applications
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "officers_can_update" ON driver_applications;
CREATE POLICY "officers_can_update" ON driver_applications
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 3. Add to Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'driver_applications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE driver_applications;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Create driver-documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-documents', 'driver-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies
DROP POLICY IF EXISTS "anon_can_upload_docs" ON storage.objects;
CREATE POLICY "anon_can_upload_docs"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'driver-documents');

DROP POLICY IF EXISTS "public_can_read_docs" ON storage.objects;
CREATE POLICY "public_can_read_docs"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'driver-documents');

-- 5. Approve application RPC (called by Edge Function via service role)
-- This function inserts the driver into the existing drivers table.
-- The Edge Function creates the Auth user first, then calls this with the auth_user_id.
CREATE OR REPLACE FUNCTION approve_driver_application(
  p_application_id    UUID,
  p_auth_user_id      UUID,
  p_generated_code    TEXT,
  p_approved_by       TEXT
)
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  v_app   driver_applications%ROWTYPE;
  v_driver_id UUID;
BEGIN
  SELECT * INTO v_app FROM driver_applications WHERE id = p_application_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Application not found');
  END IF;
  
  IF v_app.application_status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Application already processed');
  END IF;

  -- Insert into existing drivers table
  INSERT INTO drivers (
    name, email, phone, auth_user_id, status,
    latitude, longitude
  ) VALUES (
    v_app.full_name,
    v_app.email,
    v_app.phone,
    p_auth_user_id,
    'available',
    0.0, 0.0
  ) RETURNING id INTO v_driver_id;

  -- Update application
  UPDATE driver_applications
  SET
    application_status  = 'approved',
    driver_id           = v_driver_id,
    generated_driver_code = p_generated_code,
    approved_by         = p_approved_by,
    approved_at         = NOW(),
    updated_at          = NOW()
  WHERE id = p_application_id;

  RETURN json_build_object(
    'success', true,
    'driver_id', v_driver_id,
    'driver_code', p_generated_code
  );
END;
$$ LANGUAGE plpgsql;

-- 6. Reject application RPC
CREATE OR REPLACE FUNCTION reject_driver_application(
  p_application_id UUID,
  p_remarks        TEXT,
  p_rejected_by    TEXT
)
RETURNS VOID
SECURITY DEFINER
AS $$
BEGIN
  UPDATE driver_applications
  SET
    application_status = 'rejected',
    rejection_remarks  = p_remarks,
    approved_by        = p_rejected_by,
    updated_at         = NOW()
  WHERE id = p_application_id;
END;
$$ LANGUAGE plpgsql;
