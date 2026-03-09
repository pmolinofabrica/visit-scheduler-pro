GRANT ALL ON public.seguimiento_llamados_visita TO anon;
GRANT ALL ON public.seguimiento_llamados_visita TO authenticated;
GRANT ALL ON public.seguimiento_llamados_visita TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;