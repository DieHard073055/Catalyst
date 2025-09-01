-- Create temp-logos bucket for QR code logo uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp-logos', 
  'temp-logos', 
  true, 
  5242880, -- 5MB limit
  '["image/png","image/jpeg","image/jpg","image/gif","image/svg+xml","image/webp"]'
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for temp-logos bucket
CREATE POLICY "Users can upload their own logos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'temp-logos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view logos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'temp-logos');

CREATE POLICY "Users can delete their own logos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'temp-logos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );