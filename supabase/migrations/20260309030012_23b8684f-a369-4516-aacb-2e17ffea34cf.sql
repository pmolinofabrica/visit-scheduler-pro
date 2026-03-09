
ALTER TABLE public.correos_visita
DROP CONSTRAINT correos_visita_tipo_correo_check;

ALTER TABLE public.correos_visita
ADD CONSTRAINT correos_visita_tipo_correo_check
CHECK (tipo_correo::text = ANY (ARRAY['asignacion','confirmacion','recordatorio','seguimiento','otro']::text[]));
