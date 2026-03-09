
-- Fix: missing Postgres privileges (GRANT) for correos_visita
-- The error is "permission denied for table correos_visita" (42501), which is a GRANT/privilege issue (not an RLS policy violation).

GRANT SELECT, INSERT, UPDATE
ON TABLE public.correos_visita
TO authenticated;

GRANT USAGE, SELECT
ON SEQUENCE public.correos_visita_id_correo_seq
TO authenticated;
