-- Migration: 0016_add_locations
-- Description: Add clinic locations table for multi-location clinic chain support
-- Created: 2026-05-30

-- Clinic locations table (additional branches beyond primary address on clinics table)
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- Location details
  name text NOT NULL,                        -- e.g. "Downtown Branch"
  address text,
  city text NOT NULL,
  state text NOT NULL,
  zip text,
  country text NOT NULL DEFAULT 'US',
  lat numeric(10, 7),
  lng numeric(10, 7),

  -- Contact
  phone text,
  email text,

  -- Operating hours for this location
  opening_hours text[],

  -- Status
  is_active boolean NOT NULL DEFAULT true,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by clinic
CREATE INDEX IF NOT EXISTS idx_locations_clinic ON locations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(clinic_id, is_active);

-- Unique constraint: no duplicate location names within a clinic
CREATE UNIQUE INDEX IF NOT EXISTS uq_locations_clinic_name
  ON locations(clinic_id, name)
  WHERE is_active = true;

-- Updated-at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
