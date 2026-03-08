CREATE TABLE public.seguimiento_llamados_visita (
    id_llamado SERIAL PRIMARY KEY,
    id_asignacion INTEGER REFERENCES public.asignaciones_visita(id_asignacion) ON DELETE CASCADE,
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    agente TEXT,
    atendio BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.seguimiento_llamados_visita ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_seguimiento_llamados" ON public.seguimiento_llamados_visita FOR SELECT USING (true);
CREATE POLICY "anon_write_seguimiento_llamados" ON public.seguimiento_llamados_visita FOR ALL USING (true) WITH CHECK (true);
