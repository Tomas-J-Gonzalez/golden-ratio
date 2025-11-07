-- Add votes_revealed column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS votes_revealed BOOLEAN DEFAULT FALSE;

-- Update the status CHECK constraint to include new statuses
ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS tasks_status_check;

ALTER TABLE tasks 
ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('pending', 'voting', 'voting_completed', 'completed'));

-- Set votes_revealed to true for all existing completed tasks
UPDATE tasks 
SET votes_revealed = TRUE 
WHERE status IN ('completed', 'voting_completed');

