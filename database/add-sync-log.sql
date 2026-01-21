-- ============================================
-- ADD SYNC LOG TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- Create sync_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type VARCHAR(50) NOT NULL,  -- 'full', 'incremental', 'csv_import'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    errors JSONB,
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    triggered_by UUID REFERENCES authors(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON sync_log(status);
CREATE INDEX IF NOT EXISTS idx_sync_log_started ON sync_log(started_at DESC);

-- Allow admins to insert sync logs
CREATE POLICY IF NOT EXISTS "Admins can insert sync logs" ON sync_log
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM authors WHERE id = auth.uid() AND is_admin = true)
    );

-- Allow admins to view sync logs
CREATE POLICY IF NOT EXISTS "Admins can view sync logs" ON sync_log
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM authors WHERE id = auth.uid() AND is_admin = true)
    );

-- Enable RLS
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users (RLS will filter)
GRANT SELECT, INSERT ON sync_log TO authenticated;
