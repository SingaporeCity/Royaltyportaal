-- ============================================
-- MIGRATION: Add file_path to payments table
-- Run in Supabase SQL Editor
-- ============================================

-- Add file_path column for linking uploaded PDF statements
ALTER TABLE payments ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_file_path ON payments(file_path) WHERE file_path IS NOT NULL;
