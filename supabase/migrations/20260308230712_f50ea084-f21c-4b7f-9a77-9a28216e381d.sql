
-- Tabla de asignaciones de visita (registro DAMA)
CREATE TABLE public.asignaciones_visita (
    id_asignacion SERIAL PRIMARY KEY,
    id_visita INTEGER REFERENCES public.visitas_grupales(id_visita) ON DELETE SET NULL,
    id_plani INTEGER REFERENCES public.planificacion(id_plani) ON DELETE SET NULL,
    estado VARCHAR NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','asignado','en_espera','confirmado','cancelado','duplicado','corregido')),
    cantidad_personas_original INTEGER NOT NULL DEFAULT 0,
    id_coeficiente INTEGER REFERENCES public.config_visitas_coeficientes(id_coeficiente),
    coeficiente_aplicado NUMERIC NOT NULL DEFAULT 1.00,
    cupo_calculado NUMERIC NOT NULL DEFAULT 0,
    nombre_institucion TEXT,
    nombre_referente TEXT,
    email_referente TEXT,
    telefono_referente TEXT,
    telefono_institucion TEXT,
    nombre_empresa TEXT,
    rango_etario TEXT,
    mes_solicitado INTEGER,
    agente_asigno TEXT,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de correos enviados
CREATE TABLE public.correos_visita (
    id_correo SERIAL PRIMARY KEY,
    id_asignacion INTEGER REFERENCES public.asignaciones_visita(id_asignacion) ON DELETE CASCADE NOT NULL,
    tipo_correo VARCHAR NOT NULL DEFAULT 'confirmacion' CHECK (tipo_correo IN ('confirmacion','recordatorio','seguimiento','otro')),
    asunto TEXT,
    cuerpo TEXT,
    destinatario_email TEXT NOT NULL,
    fecha_envio TIMESTAMP,
    estado_envio VARCHAR NOT NULL DEFAULT 'borrador' CHECK (estado_envio IN ('borrador','enviado','fallido')),
    respuesta_recibida BOOLEAN DEFAULT FALSE,
    fecha_respuesta TIMESTAMP,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Historial de cambios de estado de asignaciones
CREATE TABLE public.asignaciones_visita_historial (
    id_hist SERIAL PRIMARY KEY,
    id_asignacion INTEGER REFERENCES public.asignaciones_visita(id_asignacion) ON DELETE CASCADE NOT NULL,
    estado_anterior VARCHAR,
    estado_nuevo VARCHAR NOT NULL,
    motivo TEXT,
    usuario TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RLS
ALTER TABLE public.asignaciones_visita ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correos_visita ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asignaciones_visita_historial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permissive_read_asignaciones_visita" ON public.asignaciones_visita FOR SELECT USING (true);
CREATE POLICY "permissive_write_asignaciones_visita" ON public.asignaciones_visita FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "permissive_read_correos_visita" ON public.correos_visita FOR SELECT USING (true);
CREATE POLICY "permissive_write_correos_visita" ON public.correos_visita FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "permissive_read_asignaciones_visita_historial" ON public.asignaciones_visita_historial FOR SELECT USING (true);
CREATE POLICY "permissive_write_asignaciones_visita_historial" ON public.asignaciones_visita_historial FOR ALL USING (true) WITH CHECK (true);

-- Trigger para registrar historial de cambios de estado
CREATE OR REPLACE FUNCTION public.fn_asignacion_visita_historial()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.estado IS DISTINCT FROM NEW.estado THEN
        INSERT INTO asignaciones_visita_historial (id_asignacion, estado_anterior, estado_nuevo)
        VALUES (NEW.id_asignacion, OLD.estado, NEW.estado);
    END IF;
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_asignacion_visita_historial
BEFORE UPDATE ON public.asignaciones_visita
FOR EACH ROW EXECUTE FUNCTION public.fn_asignacion_visita_historial();

-- Vista de disponibilidad por slot con semáforo
CREATE OR REPLACE VIEW public.vista_disponibilidad_visitas AS
SELECT 
    p.id_plani,
    d.fecha,
    d.mes,
    d.anio,
    d.numero_dia_semana,
    t.id_turno,
    t.tipo_turno,
    t.hora_inicio,
    t.hora_fin,
    120 AS cupo_total,
    COALESCE(SUM(CASE WHEN av.estado IN ('asignado','confirmado') THEN av.cupo_calculado ELSE 0 END), 0) AS cupo_ocupado_firme,
    COALESCE(SUM(CASE WHEN av.estado = 'en_espera' THEN av.cupo_calculado ELSE 0 END), 0) AS cupo_en_espera,
    120 - COALESCE(SUM(CASE WHEN av.estado IN ('asignado','confirmado') THEN av.cupo_calculado ELSE 0 END), 0) AS cupo_disponible,
    CASE 
        WHEN 120 - COALESCE(SUM(CASE WHEN av.estado IN ('asignado','confirmado') THEN av.cupo_calculado ELSE 0 END), 0) > 15 THEN 'verde'
        WHEN 120 - COALESCE(SUM(CASE WHEN av.estado IN ('asignado','confirmado') THEN av.cupo_calculado ELSE 0 END), 0) >= -15 THEN 'amarillo'
        ELSE 'rojo'
    END AS semaforo
FROM planificacion p
JOIN dias d ON p.id_dia = d.id_dia
JOIN turnos t ON p.id_turno = t.id_turno
LEFT JOIN asignaciones_visita av ON av.id_plani = p.id_plani AND av.estado NOT IN ('cancelado','duplicado')
WHERE t.id_turno IN (3, 4)
GROUP BY p.id_plani, d.fecha, d.mes, d.anio, d.numero_dia_semana, t.id_turno, t.tipo_turno, t.hora_inicio, t.hora_fin;
