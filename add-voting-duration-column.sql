-- Add voting_duration_seconds column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS voting_duration_seconds INTEGER;

-- Add comment to explain the column
COMMENT ON COLUMN tasks.voting_duration_seconds IS 'Duration in seconds that voting took for this task';

