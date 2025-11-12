-- Add DELETE policy for participants table
-- This allows participants to leave sessions
-- Run this in your Supabase SQL Editor

CREATE POLICY "Participants can be deleted by anyone" ON participants
  FOR DELETE USING (true);

