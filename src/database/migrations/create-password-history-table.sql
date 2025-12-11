-- Create password_history table
CREATE TABLE IF NOT EXISTS password_history (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_history_user FOREIGN KEY ("userId") 
        REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_password_history_user_created 
    ON password_history("userId", "createdAt" DESC);

-- Add comment
COMMENT ON TABLE password_history IS 'Stores password history to prevent password reuse';
COMMENT ON COLUMN password_history."passwordHash" IS 'Hashed password for comparison';

