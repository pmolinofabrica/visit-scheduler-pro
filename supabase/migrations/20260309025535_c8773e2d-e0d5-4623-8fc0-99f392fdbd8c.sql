
-- Add PERMISSIVE policies for authenticated users on correos_visita
CREATE POLICY "authenticated_read_correos_visita"
ON public.correos_visita FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_insert_correos_visita"
ON public.correos_visita FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated_update_correos_visita"
ON public.correos_visita FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
