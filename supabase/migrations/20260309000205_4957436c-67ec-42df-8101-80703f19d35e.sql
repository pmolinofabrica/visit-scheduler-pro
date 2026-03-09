DROP POLICY IF EXISTS "anon_write_asignaciones_visita" ON public.asignaciones_visita;
DROP POLICY IF EXISTS "anon_read_asignaciones_visita" ON public.asignaciones_visita;
DROP POLICY IF EXISTS "permissive_read_asignaciones_visita" ON public.asignaciones_visita;
DROP POLICY IF EXISTS "permissive_write_asignaciones_visita" ON public.asignaciones_visita;

CREATE POLICY "permissive_all_asignaciones_visita" ON public.asignaciones_visita
AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_write_seguimiento_llamados" ON public.seguimiento_llamados_visita;
DROP POLICY IF EXISTS "anon_read_seguimiento_llamados" ON public.seguimiento_llamados_visita;

CREATE POLICY "permissive_all_seguimiento_llamados" ON public.seguimiento_llamados_visita
AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);
