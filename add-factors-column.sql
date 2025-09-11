-- Add factors column to votes table if it doesn't exist
ALTER TABLE votes ADD COLUMN IF NOT EXISTS factors JSONB;
