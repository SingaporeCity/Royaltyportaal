-- ============================================
-- STORAGE: Create 'statements' bucket + RLS policies
-- Run in Supabase SQL Editor
-- ============================================

-- Create the private bucket (if using SQL; otherwise create via Dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES ('statements', 'statements', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Authors can download their own statements
-- File path convention: {author_uuid}/{type}/{year}/{filename}.pdf
CREATE POLICY "Authors can download own statements"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'statements'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Policy: Admins can upload statements
CREATE POLICY "Admins can upload statements"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'statements'
    AND EXISTS (SELECT 1 FROM public.authors WHERE id = auth.uid() AND is_admin = true)
);

-- Policy: Admins can update statements
CREATE POLICY "Admins can update statements"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'statements'
    AND EXISTS (SELECT 1 FROM public.authors WHERE id = auth.uid() AND is_admin = true)
);

-- Policy: Admins can delete statements
CREATE POLICY "Admins can delete statements"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'statements'
    AND EXISTS (SELECT 1 FROM public.authors WHERE id = auth.uid() AND is_admin = true)
);
