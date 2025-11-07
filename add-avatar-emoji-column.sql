-- Add avatar_emoji column to participants table
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS avatar_emoji VARCHAR(10);

-- Optionally set default emojis for existing participants
UPDATE participants 
SET avatar_emoji = '🍎' 
WHERE avatar_emoji IS NULL;

