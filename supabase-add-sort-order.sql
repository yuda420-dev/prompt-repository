-- ============================================
-- ADD SORT_ORDER COLUMN FOR SERIES REORDERING
-- Run this in Supabase SQL Editor
-- ============================================

-- Add sort_order column to artworks table
-- This column stores the position of each artwork within its series
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create index for faster sorting within series
CREATE INDEX IF NOT EXISTS idx_artworks_series_order ON artworks(series_name, sort_order);

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'artworks' AND column_name = 'sort_order';
