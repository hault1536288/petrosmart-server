-- Add new columns to OTP table for attempt tracking
ALTER TABLE otps 
ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "isLocked" BOOLEAN DEFAULT FALSE;

-- Add comment
COMMENT ON COLUMN otps.attempts IS 'Number of failed verification attempts';
COMMENT ON COLUMN otps."isLocked" IS 'Whether OTP is locked due to too many failed attempts';

