-- Create the product-images storage bucket if it doesn't exist.
-- The bucket is intentionally NOT public: images are served via getPublicUrl()
-- which works because of the "Public read product images" RLS policy on storage.objects.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  false,
  5242880,  -- 5 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;
