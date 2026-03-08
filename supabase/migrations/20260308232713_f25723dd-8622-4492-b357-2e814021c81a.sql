
-- Grant SELECT on config_visitas_coeficientes to anon and authenticated
GRANT SELECT ON public.config_visitas_coeficientes TO anon, authenticated;

-- Add permissive RLS policies for config_visitas_coeficientes
ALTER TABLE public.config_visitas_coeficientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_read_config_visitas_coeficientes"
  ON public.config_visitas_coeficientes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Grant SELECT on vista_disponibilidad_visitas to anon and authenticated
GRANT SELECT ON public.vista_disponibilidad_visitas TO anon, authenticated;
