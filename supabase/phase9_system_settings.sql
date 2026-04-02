-- Phase 9: System settings table for runtime-overridable configuration
-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS system_settings (
  key        text PRIMARY KEY,
  value      text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Only superadmin can read/write system settings
CREATE POLICY "superadmin only"
  ON system_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );
