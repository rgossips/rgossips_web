-- Table to store OTPs generated server-side for WhatsApp verification
CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by phone
CREATE INDEX idx_otp_verifications_phone ON otp_verifications (phone, expires_at DESC);

-- Auto-delete expired OTPs (run via pg_cron or Supabase scheduled function)
-- DELETE FROM otp_verifications WHERE expires_at < NOW();
