-- Remove unused password reset columns from users table
ALTER TABLE users 
DROP COLUMN IF EXISTS "resetPasswordToken",
DROP COLUMN IF EXISTS "resetPasswordExpires";

-- Add comment
COMMENT ON TABLE users IS 'Password reset is now handled via OTP system, not tokens';

