-- Add UPDATE policy for participants table
-- This allows participants to update their own data (like avatar_emoji)
-- Run this in your Supabase SQL Editor

CREATE POLICY "Participants can be updated by anyone" ON participants
  FOR UPDATE USING (true);

