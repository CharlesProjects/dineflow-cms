CREATE OR REPLACE FUNCTION public.current_user_business_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
STABLE
AS $$
  SELECT business_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
STABLE
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "businesses_admin_own_business"
ON public.businesses
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = businesses.id
      AND p.role = 'ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = businesses.id
      AND p.role = 'ADMIN'
  )
);

CREATE POLICY "profiles_select_own_business"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = profiles.business_id
      AND p.role IN ('ADMIN', 'EDITOR', 'VIEWER')
  )
);

CREATE POLICY "profiles_update_own_profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND business_id = public.current_user_business_id()
  AND role = public.current_user_role()
);

CREATE POLICY "profiles_no_anonymous_access"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY "business_settings_public_read"
ON public.business_settings
FOR SELECT
TO anon
USING (is_published = true);

CREATE POLICY "business_settings_authenticated_read_own_business"
ON public.business_settings
FOR SELECT
TO authenticated
USING (
  is_published = true
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = business_settings.business_id
      AND p.role IN ('ADMIN', 'EDITOR', 'VIEWER')
  )
);

CREATE POLICY "business_settings_admin_manage_own_business"
ON public.business_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = business_settings.business_id
      AND p.role = 'ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = business_settings.business_id
      AND p.role = 'ADMIN'
  )
);

CREATE POLICY "business_admin_settings_admin_only"
ON public.business_admin_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = business_admin_settings.business_id
      AND p.role = 'ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = business_admin_settings.business_id
      AND p.role = 'ADMIN'
  )
);

CREATE POLICY "business_admin_settings_no_anonymous"
ON public.business_admin_settings
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY "business_hours_public_read"
ON public.business_hours
FOR SELECT
TO anon
USING (is_published = true);

CREATE POLICY "business_hours_authenticated_read_own_business"
ON public.business_hours
FOR SELECT
TO authenticated
USING (
  is_published = true
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = business_hours.business_id
      AND p.role IN ('ADMIN', 'EDITOR', 'VIEWER')
  )
);

CREATE POLICY "business_hours_manage_own_business"
ON public.business_hours
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = business_hours.business_id
      AND p.role IN ('ADMIN', 'EDITOR')
  )
)
WITH CHECK (
  business_id = public.current_user_business_id()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = business_hours.business_id
      AND p.role IN ('ADMIN', 'EDITOR')
  )
);

CREATE POLICY "menu_categories_public_read"
ON public.menu_categories
FOR SELECT
TO anon
USING (is_published = true);

CREATE POLICY "menu_categories_auth_read"
ON public.menu_categories
FOR SELECT
TO authenticated
USING (
  is_published = true
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = menu_categories.business_id
      AND p.role IN ('ADMIN', 'EDITOR', 'VIEWER')
  )
);

CREATE POLICY "menu_categories_manage_own_business"
ON public.menu_categories
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = menu_categories.business_id
      AND p.role IN ('ADMIN', 'EDITOR')
  )
)
WITH CHECK (
  business_id = public.current_user_business_id()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = menu_categories.business_id
      AND p.role IN ('ADMIN', 'EDITOR')
  )
);

CREATE POLICY "menu_items_public_read"
ON public.menu_items
FOR SELECT
TO anon
USING (is_published = true AND is_available = true);

CREATE POLICY "menu_items_auth_read"
ON public.menu_items
FOR SELECT
TO authenticated
USING (
  is_published = true
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = menu_items.business_id
      AND p.role IN ('ADMIN', 'EDITOR', 'VIEWER')
  )
);

CREATE POLICY "menu_items_manage_own_business"
ON public.menu_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = menu_items.business_id
      AND p.role IN ('ADMIN', 'EDITOR')
  )
)
WITH CHECK (
  business_id = public.current_user_business_id()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = menu_items.business_id
      AND p.role IN ('ADMIN', 'EDITOR')
  )
  AND EXISTS (
    SELECT 1
    FROM public.menu_categories mc
    WHERE mc.id = menu_items.category_id
      AND mc.business_id = menu_items.business_id
  )
);

CREATE POLICY "promotions_public_read"
ON public.promotions
FOR SELECT
TO anon
USING (
  is_published = true
  AND current_date >= start_date
  AND current_date <= end_date
);

CREATE POLICY "promotions_auth_read"
ON public.promotions
FOR SELECT
TO authenticated
USING (
  is_published = true
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = promotions.business_id
      AND p.role IN ('ADMIN', 'EDITOR', 'VIEWER')
  )
);

CREATE POLICY "promotions_manage_own_business"
ON public.promotions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = promotions.business_id
      AND p.role IN ('ADMIN', 'EDITOR')
  )
)
WITH CHECK (
  business_id = public.current_user_business_id()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = promotions.business_id
      AND p.role IN ('ADMIN', 'EDITOR')
  )
);

CREATE POLICY "gallery_public_read"
ON public.gallery_items
FOR SELECT
TO anon
USING (is_published = true);

CREATE POLICY "gallery_auth_read"
ON public.gallery_items
FOR SELECT
TO authenticated
USING (
  is_published = true
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = gallery_items.business_id
      AND p.role IN ('ADMIN', 'EDITOR', 'VIEWER')
  )
);

CREATE POLICY "gallery_manage_own_business"
ON public.gallery_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = gallery_items.business_id
      AND p.role IN ('ADMIN', 'EDITOR')
  )
)
WITH CHECK (
  business_id = public.current_user_business_id()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = gallery_items.business_id
      AND p.role IN ('ADMIN', 'EDITOR')
  )
);

CREATE POLICY "testimonials_public_read"
ON public.testimonials
FOR SELECT
TO anon
USING (is_published = true);

CREATE POLICY "testimonials_auth_read"
ON public.testimonials
FOR SELECT
TO authenticated
USING (
  is_published = true
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = testimonials.business_id
      AND p.role IN ('ADMIN', 'EDITOR', 'VIEWER')
  )
);

CREATE POLICY "testimonials_manage_own_business"
ON public.testimonials
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = testimonials.business_id
      AND p.role IN ('ADMIN', 'EDITOR')
  )
)
WITH CHECK (
  business_id = public.current_user_business_id()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = testimonials.business_id
      AND p.role IN ('ADMIN', 'EDITOR')
  )
);

CREATE POLICY "faqs_public_read"
ON public.faqs
FOR SELECT
TO anon
USING (is_published = true);

CREATE POLICY "faqs_auth_read"
ON public.faqs
FOR SELECT
TO authenticated
USING (
  is_published = true
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = faqs.business_id
      AND p.role IN ('ADMIN', 'EDITOR', 'VIEWER')
  )
);

CREATE POLICY "faqs_manage_own_business"
ON public.faqs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = faqs.business_id
      AND p.role IN ('ADMIN', 'EDITOR')
  )
)
WITH CHECK (
  business_id = public.current_user_business_id()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = faqs.business_id
      AND p.role IN ('ADMIN', 'EDITOR')
  )
);

CREATE POLICY "reservation_requests_public_insert"
ON public.reservation_requests
FOR INSERT
TO anon
WITH CHECK (
  business_id IS NOT NULL
  AND honeypot = ''
  AND name !~ '\s*$'
  AND email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
  AND party_size > 0
  AND requested_date >= current_date
  AND char_length(message) BETWEEN 10 AND 1000
);

CREATE POLICY "reservation_requests_no_public_read_modify"
ON public.reservation_requests
FOR SELECT
TO anon
USING (false);

CREATE POLICY "reservation_requests_auth_read_manage_own_business"
ON public.reservation_requests
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = reservation_requests.business_id
      AND p.role IN ('ADMIN', 'EDITOR', 'VIEWER')
  )
)
WITH CHECK (
  business_id = public.current_user_business_id()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = reservation_requests.business_id
      AND p.role IN ('ADMIN', 'EDITOR')
  )
);

CREATE POLICY "contact_requests_public_insert"
ON public.contact_requests
FOR INSERT
TO anon
WITH CHECK (
  business_id IS NOT NULL
  AND name !~ '\s*$'
  AND email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
  AND char_length(message) BETWEEN 10 AND 2000
);

CREATE POLICY "contact_requests_no_public_read"
ON public.contact_requests
FOR SELECT
TO anon
USING (false);

CREATE POLICY "contact_requests_auth_read_manage_own_business"
ON public.contact_requests
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = contact_requests.business_id
      AND p.role IN ('ADMIN', 'EDITOR', 'VIEWER')
  )
)
WITH CHECK (
  business_id = public.current_user_business_id()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = contact_requests.business_id
      AND p.role IN ('ADMIN', 'EDITOR')
  )
);

CREATE POLICY "audit_logs_admin_only"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = audit_logs.business_id
      AND p.role = 'ADMIN'
  )
);

CREATE POLICY "audit_logs_no_write_for_normal_users"
ON public.audit_logs
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "audit_logs_no_anonymous_access"
ON public.audit_logs
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

REVOKE ALL ON public.businesses FROM public, anon, authenticated;
REVOKE ALL ON public.profiles FROM public, anon, authenticated;
REVOKE ALL ON public.business_settings FROM public, anon, authenticated;
REVOKE ALL ON public.business_admin_settings FROM public, anon, authenticated;
REVOKE ALL ON public.business_hours FROM public, anon, authenticated;
REVOKE ALL ON public.menu_categories FROM public, anon, authenticated;
REVOKE ALL ON public.menu_items FROM public, anon, authenticated;
REVOKE ALL ON public.promotions FROM public, anon, authenticated;
REVOKE ALL ON public.gallery_items FROM public, anon, authenticated;
REVOKE ALL ON public.testimonials FROM public, anon, authenticated;
REVOKE ALL ON public.faqs FROM public, anon, authenticated;
REVOKE ALL ON public.reservation_requests FROM public, anon, authenticated;
REVOKE ALL ON public.contact_requests FROM public, anon, authenticated;
REVOKE ALL ON public.audit_logs FROM public, anon, authenticated;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.business_settings TO anon;
GRANT SELECT ON public.business_hours TO anon;
GRANT SELECT ON public.menu_categories TO anon;
GRANT SELECT ON public.menu_items TO anon;
GRANT SELECT ON public.promotions TO anon;
GRANT SELECT ON public.gallery_items TO anon;
GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT ON public.faqs TO anon;
GRANT INSERT ON public.reservation_requests TO anon;
GRANT INSERT ON public.contact_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_admin_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_hours TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservation_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_requests TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;

REVOKE ALL ON public.business_admin_settings FROM public;
REVOKE ALL ON public.audit_logs FROM public;
