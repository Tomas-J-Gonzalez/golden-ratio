-- Add sequencing fields to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS quarter VARCHAR(20),
ADD COLUMN IF NOT EXISTS sprint_number INTEGER,
ADD COLUMN IF NOT EXISTS sequence_order INTEGER;

-- Add sequencing configuration to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS sequencing_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sequencing_quarter VARCHAR(20),
ADD COLUMN IF NOT EXISTS sequencing_starting_sprint INTEGER,
ADD COLUMN IF NOT EXISTS sequencing_sprints_per_quarter INTEGER DEFAULT 6;

-- Add comments
COMMENT ON COLUMN tasks.quarter IS 'Quarter assignment for task (e.g., Q4 2024)';
COMMENT ON COLUMN tasks.sprint_number IS 'Sprint number assignment for task';
COMMENT ON COLUMN tasks.sequence_order IS 'Order within sprint for sequencing';
COMMENT ON COLUMN sessions.sequencing_enabled IS 'Whether task sequencing has been started for this session';
COMMENT ON COLUMN sessions.sequencing_quarter IS 'Quarter configured for sequencing (e.g., Q4 2024)';
COMMENT ON COLUMN sessions.sequencing_starting_sprint IS 'Starting sprint number for sequencing';
COMMENT ON COLUMN sessions.sequencing_sprints_per_quarter IS 'Number of sprints per quarter';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_sequencing ON tasks(quarter, sprint_number, sequence_order);
CREATE INDEX IF NOT EXISTS idx_tasks_sprint_number ON tasks(sprint_number);

