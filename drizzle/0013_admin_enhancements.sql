-- Migration: Admin Panel Enhancements
-- - email_logs: Track every email sent for stats/reporting
-- - newsletter_subscribers: Dedicated subscriber management with status tracking
-- - patient_enquiries: Dedicated enquiries with doctor FK and status workflow
-- - admin_audit_log: Admin action audit trail

-- Email logs
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid,
  campaign_name text,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  sent_at timestamp with time zone DEFAULT NOW(),
  delivered_at timestamp with time zone,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  bounced_at timestamp with time zone,
  complained_at timestamp with time zone,
  unsubscribed_at timestamp with time zone,
  error_message text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT NOW()
);

CREATE INDEX idx_email_logs_campaign ON email_logs(campaign_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX idx_email_logs_sent ON email_logs(sent_at DESC);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  status text NOT NULL DEFAULT 'subscribed',
  source text,
  confirmed_at timestamp with time zone,
  unsubscribed_at timestamp with time zone,
  preferences jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW()
);

CREATE INDEX idx_newsletter_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);

-- Patient enquiries (specialist enquiries with full workflow)
CREATE TABLE IF NOT EXISTS patient_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text,
  doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL,
  clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL,
  doctor_name text,
  clinic_name text,
  status text NOT NULL DEFAULT 'new',
  priority text DEFAULT 'normal',
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  source_url text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW(),
  deleted_at timestamp with time zone
);

CREATE INDEX idx_patient_enquiries_status ON patient_enquiries(status);
CREATE INDEX idx_patient_enquiries_doctor ON patient_enquiries(doctor_id);
CREATE INDEX idx_idx_patient_enquiries_clinic ON patient_enquiries(clinic_id);
CREATE INDEX idx_patient_enquiries_assigned ON patient_enquiries(assigned_to);
CREATE INDEX idx_patient_enquiries_created ON patient_enquiries(created_at DESC);

-- Admin action audit trail
CREATE TABLE IF NOT EXISTS admin_action_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  user_email text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT NOW()
);

CREATE INDEX idx_admin_action_user ON admin_action_log(user_id);
CREATE INDEX idx_admin_action_created ON admin_action_log(created_at DESC);
CREATE INDEX idx_admin_action_entity ON admin_action_log(entity_type, entity_id);

-- Add doctor FK to leads for proper linking
ALTER TABLE leads ADD COLUMN IF NOT EXISTS doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL;

-- Migrate existing specialist_enquiry leads to patient_enquiries
INSERT INTO patient_enquiries (name, email, phone, message, doctor_name, clinic_name, clinic_id, doctor_id, status, source_url, metadata, created_at)
SELECT
  COALESCE(name, 'Unknown'),
  email,
  phone,
  message,
  doctor_name,
  clinic_name,
  clinic_id,
  NULL::uuid,
  COALESCE(metadata->>'status', 'new'),
  source_url,
  metadata,
  created_at
FROM leads
WHERE type = 'specialist_enquiry'
  AND NOT EXISTS (SELECT 1 FROM patient_enquiries WHERE email = leads.email AND created_at = leads.created_at);

COMMENT ON TABLE email_logs IS 'Tracks every email sent for delivery/open/click/bounce stats';
COMMENT ON TABLE newsletter_subscribers IS 'Newsletter subscribers with subscription status tracking';
COMMENT ON TABLE patient_enquiries IS 'Patient specialist enquiries with doctor assignment and status workflow';
COMMENT ON TABLE admin_action_log IS 'Detailed admin action audit trail with before/after values';
