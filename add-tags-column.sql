-- Add tags column to tasks table
-- Tags will be stored as JSONB array: [{"label": "tag name", "color": "pastel-blue"}]
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN tasks.tags IS 'Array of tags with label and color for categorizing tasks';

-- Add index for better query performance on tags
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON tasks USING GIN (tags);

