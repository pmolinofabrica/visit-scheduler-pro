
-- Grant table access to anon role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asignaciones_visita TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.correos_visita TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asignaciones_visita_historial TO anon;

-- Add PERMISSIVE policies (the existing ones are RESTRICTIVE which require a permissive policy to exist)
CREATE POLICY "anon_read_asignaciones_visita"
  ON public.asignaciones_visita
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_write_asignaciones_visita"
  ON public.asignaciones_visita
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_read_correos_visita"
  ON public.correos_visita
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_write_correos_visita"
  ON public.correos_visita
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_read_asignaciones_visita_historial"
  ON public.asignaciones_visita_historial
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_write_asignaciones_visita_historial"
  ON public.asignaciones_visita_historial
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
