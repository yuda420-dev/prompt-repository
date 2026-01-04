-- Create deleted_artworks table for tracking permanently deleted items
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS deleted_artworks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artwork_id TEXT NOT NULL UNIQUE,
  deleted_by TEXT NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE deleted_artworks ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read deleted_artworks (to know what's been deleted)
CREATE POLICY "Anyone can view deleted artworks"
  ON deleted_artworks
  FOR SELECT
  USING (true);

-- Policy: Only admin (hiper.6258@gmail.com) can insert/delete
CREATE POLICY "Only admin can mark artworks as deleted"
  ON deleted_artworks
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'hiper.6258@gmail.com');

CREATE POLICY "Only admin can remove from deleted list"
  ON deleted_artworks
  FOR DELETE
  USING (auth.jwt() ->> 'email' = 'hiper.6258@gmail.com');

-- Also update the artworks table policy to allow admin to delete
-- First, drop existing delete policy if it exists
DROP POLICY IF EXISTS "Users can delete own artworks" ON artworks;
DROP POLICY IF EXISTS "Admin can delete any artwork" ON artworks;

-- Create new delete policies
CREATE POLICY "Admin can delete any artwork"
  ON artworks
  FOR DELETE
  USING (auth.jwt() ->> 'email' = 'hiper.6258@gmail.com');

CREATE POLICY "Users can delete own artworks"
  ON artworks
  FOR DELETE
  USING (auth.uid() = user_id);
