-- Phase 32: Appointment availability settings per establishment
-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS appointment_settings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id  UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  slot_minutes      INT  NOT NULL DEFAULT 30,         -- duration of each time slot
  max_per_slot      INT  NOT NULL DEFAULT 1,          -- max concurrent appointments per slot
  open_days         INT[] NOT NULL DEFAULT '{1,2,3,4,5}', -- 0=Sun,1=Mon..6=Sat
  open_time         TIME NOT NULL DEFAULT '08:00',
  close_time        TIME NOT NULL DEFAULT '18:00',
  advance_days      INT  NOT NULL DEFAULT 30,         -- how many days ahead clients can book
  buffer_minutes    INT  NOT NULL DEFAULT 0,          -- gap between slots
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(establishment_id)
);

-- Allow brand admins/advisors to read; only brand_admin to write
ALTER TABLE appointment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand users can read appointment_settings"
  ON appointment_settings FOR SELECT
  USING (
    establishment_id IN (
      SELECT id FROM establishments
      WHERE brand_id IN (
        SELECT brand_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "brand admins can write appointment_settings"
  ON appointment_settings FOR ALL
  USING (
    establishment_id IN (
      SELECT id FROM establishments
      WHERE brand_id IN (
        SELECT brand_id FROM profiles
        WHERE id = auth.uid() AND role IN ('brand_admin', 'manager', 'superadmin')
      )
    )
  );

-- Public (anon) can read settings to show availability on booking page
CREATE POLICY "public can read appointment_settings"
  ON appointment_settings FOR SELECT
  TO anon
  USING (is_active = TRUE);
