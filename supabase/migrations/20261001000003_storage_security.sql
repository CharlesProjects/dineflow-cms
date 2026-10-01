CREATE OR REPLACE FUNCTION public.storage_path_business_id(p_path text)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_catalog
AS $$
  SELECT CASE
    WHEN p_path ~ '^business/[0-9a-fA-F-]+/' THEN
      regexp_replace(p_path, '^business/([0-9a-fA-F-]+)/.*$', '\1')::uuid
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.storage_path_is_public_business_asset(p_path text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_catalog
AS $$
  SELECT p_path ~ '^business/[0-9a-fA-F-]+/public/'
$$;



CREATE POLICY "business_assets_private_upload_same_business"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-assets'
  AND public.storage_path_business_id(name) = public.current_user_business_id()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = public.storage_path_business_id(name)
      AND p.role IN ('ADMIN', 'EDITOR')
  )
  AND name !~ '(^|/)\.'
);

CREATE POLICY "business_assets_private_select_same_business"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-assets'
  AND public.storage_path_business_id(name) = public.current_user_business_id()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = public.storage_path_business_id(name)
      AND p.role IN ('ADMIN', 'EDITOR', 'VIEWER')
  )
);

CREATE POLICY "business_assets_private_update_same_business"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'business-assets'
  AND public.storage_path_business_id(name) = public.current_user_business_id()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = public.storage_path_business_id(name)
      AND p.role IN ('ADMIN', 'EDITOR')
  )
)
WITH CHECK (
  bucket_id = 'business-assets'
  AND public.storage_path_business_id(name) = public.current_user_business_id()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = public.storage_path_business_id(name)
      AND p.role IN ('ADMIN', 'EDITOR')
  )
);

CREATE POLICY "business_assets_private_delete_same_business"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-assets'
  AND public.storage_path_business_id(name) = public.current_user_business_id()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = public.storage_path_business_id(name)
      AND p.role IN ('ADMIN', 'EDITOR')
  )
);

CREATE POLICY "business_public_select_intentionally_public"
ON storage.objects
FOR SELECT
TO anon
USING (
  bucket_id = 'business-public'
  AND public.storage_path_is_public_business_asset(name) = true
);

CREATE POLICY "business_public_read_same_business_authenticated"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-public'
  AND (
    public.storage_path_is_public_business_asset(name) = true
    OR public.storage_path_business_id(name) = public.current_user_business_id()
  )
);

CREATE POLICY "business_public_upload_same_business"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-public'
  AND public.storage_path_business_id(name) = public.current_user_business_id()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = public.storage_path_business_id(name)
      AND p.role IN ('ADMIN', 'EDITOR')
  )
  AND name ~ '^business/[0-9a-fA-F-]+/public/'
  AND name !~ '(^|/)\.'
);

CREATE POLICY "business_public_update_same_business"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'business-public'
  AND public.storage_path_business_id(name) = public.current_user_business_id()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = public.storage_path_business_id(name)
      AND p.role IN ('ADMIN', 'EDITOR')
  )
)
WITH CHECK (
  bucket_id = 'business-public'
  AND public.storage_path_business_id(name) = public.current_user_business_id()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = public.storage_path_business_id(name)
      AND p.role IN ('ADMIN', 'EDITOR')
  )
);

CREATE POLICY "business_public_delete_same_business"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-public'
  AND public.storage_path_business_id(name) = public.current_user_business_id()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = public.storage_path_business_id(name)
      AND p.role IN ('ADMIN', 'EDITOR')
  )
);

CREATE POLICY "business_assets_no_anon_access"
ON storage.objects
FOR ALL
TO anon
USING (false)
WITH CHECK (false);




