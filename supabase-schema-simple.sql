-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(6) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  moderator_id VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  nickname VARCHAR(100) NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_moderator BOOLEAN DEFAULT false
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'voting', 'completed')),
  final_estimate INTEGER,
  meeting_buffer DECIMAL(3,2) DEFAULT 0,
  iteration_multiplier INTEGER DEFAULT 1
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, participant_id)
);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create policies for sessions
CREATE POLICY "Sessions are viewable by everyone" ON sessions
  FOR SELECT USING (true);

CREATE POLICY "Sessions can be created by anyone" ON sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Sessions can be updated by moderator" ON sessions
  FOR UPDATE USING (true);

-- Create policies for participants
CREATE POLICY "Participants are viewable by everyone" ON participants
  FOR SELECT USING (true);

CREATE POLICY "Participants can be created by anyone" ON participants
  FOR INSERT WITH CHECK (true);

-- Create policies for tasks
CREATE POLICY "Tasks are viewable by everyone" ON tasks
  FOR SELECT USING (true);

CREATE POLICY "Tasks can be created by anyone" ON tasks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Tasks can be updated by anyone" ON tasks
  FOR UPDATE USING (true);

CREATE POLICY "Tasks can be deleted by anyone" ON tasks
  FOR DELETE USING (true);

-- Create policies for votes
CREATE POLICY "Votes are viewable by everyone" ON votes
  FOR SELECT USING (true);

CREATE POLICY "Votes can be created by anyone" ON votes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Votes can be updated by anyone" ON votes
  FOR UPDATE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_code ON sessions(code);
CREATE INDEX IF NOT EXISTS idx_participants_session_id ON participants(session_id);
CREATE INDEX IF NOT EXISTS idx_tasks_session_id ON tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_votes_task_id ON votes(task_id);
CREATE INDEX IF NOT EXISTS idx_votes_participant_id ON votes(participant_id);

-- Create a function to generate session codes
CREATE OR REPLACE FUNCTION generate_session_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  code VARCHAR(6);
  exists_count INTEGER;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 6));
    SELECT COUNT(*) INTO exists_count FROM sessions WHERE code = code;
    IF exists_count = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;
