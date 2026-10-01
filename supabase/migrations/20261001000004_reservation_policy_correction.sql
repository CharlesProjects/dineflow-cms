DROP POLICY IF EXISTS "reservation_requests_public_insert"
ON public.reservation_requests;

CREATE POLICY "reservation_requests_public_insert"
ON public.reservation_requests
FOR INSERT
TO anon
WITH CHECK (
  business_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.business_settings bs
    WHERE bs.business_id = reservation_requests.business_id
      AND bs.is_published = true
  )
  AND honeypot = ''
  AND name ~ '[^[:space:]]'
  AND email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
  AND party_size BETWEEN 1 AND 20
  AND requested_date >= current_date
  AND char_length(message) BETWEEN 10 AND 1000
  AND status = 'pending'
  AND notes IS NULL
);

DROP POLICY IF EXISTS "reservation_requests_auth_read_manage_own_business"
ON public.reservation_requests;

CREATE POLICY "reservation_requests_auth_read_own_business"
ON public.reservation_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = reservation_requests.business_id
      AND p.role IN ('ADMIN', 'EDITOR', 'VIEWER')
  )
);

CREATE POLICY "reservation_requests_manage_own_business"
ON public.reservation_requests
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = reservation_requests.business_id
      AND p.role IN ('ADMIN', 'EDITOR')
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

DROP POLICY IF EXISTS "contact_requests_auth_read_manage_own_business"
ON public.contact_requests;

CREATE POLICY "contact_requests_auth_read_own_business"
ON public.contact_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = contact_requests.business_id
      AND p.role IN ('ADMIN', 'EDITOR', 'VIEWER')
  )
);

CREATE POLICY "contact_requests_manage_own_business"
ON public.contact_requests
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = contact_requests.business_id
      AND p.role IN ('ADMIN', 'EDITOR')
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

CREATE OR REPLACE FUNCTION public.log_reservation_request_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    business_id,
    actor_user_id,
    action,
    entity_table,
    entity_id,
    metadata
  )
  VALUES (
    NEW.business_id,
    NULL,
    'reservation.requested',
    'reservation_requests',
    NEW.id,
    jsonb_build_object(
      'requested_date', NEW.requested_date,
      'party_size', NEW.party_size
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reservation_requests_audit_insert
ON public.reservation_requests;

CREATE TRIGGER trg_reservation_requests_audit_insert
AFTER INSERT ON public.reservation_requests
FOR EACH ROW
EXECUTE FUNCTION public.log_reservation_request_created();
