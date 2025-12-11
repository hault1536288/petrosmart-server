-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER,
    action VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    metadata JSONB,
    "isSuccessful" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY ("userId") 
        REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_user_action_created 
    ON audit_logs("userId", action, "createdAt");

CREATE INDEX IF NOT EXISTS idx_audit_ip_created 
    ON audit_logs("ipAddress", "createdAt");

CREATE INDEX IF NOT EXISTS idx_audit_email 
    ON audit_logs(email);

CREATE INDEX IF NOT EXISTS idx_audit_created 
    ON audit_logs("createdAt");

-- Add comment
COMMENT ON TABLE audit_logs IS 'Stores audit trail for security-sensitive operations';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (e.g., password_reset_requested, login_failed)';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context information in JSON format';

