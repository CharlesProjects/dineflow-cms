DROP POLICY IF EXISTS "profiles_select_own_business"
ON public.profiles;

CREATE POLICY "profiles_select_own_business"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR (
    business_id = public.current_user_business_id()
    AND public.current_user_role() IN ('ADMIN', 'EDITOR', 'VIEWER')
  )
);