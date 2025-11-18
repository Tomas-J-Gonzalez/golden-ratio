-- Add initiation date field to sessions table for sequencing
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS sequencing_initiation_date DATE;

COMMENT ON COLUMN sessions.sequencing_initiation_date IS 'Start date of the first sprint for sequencing';

