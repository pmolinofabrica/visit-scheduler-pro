-- Bootstrap missing tables and initial data for local dev

-- 1. config_visitas_coeficientes
CREATE TABLE IF NOT EXISTS public.config_visitas_coeficientes (
    id_coeficiente SERIAL PRIMARY KEY,
    nombre_categoria TEXT NOT NULL,
    rango_edad_texto TEXT,
    valor NUMERIC NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- 2. dias
CREATE TABLE IF NOT EXISTS public.dias (
    id_dia SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    dia INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    anio INTEGER NOT NULL,
    numero_dia_semana INTEGER NOT NULL,
    es_feriado BOOLEAN DEFAULT FALSE,
    descripcion_feriado TEXT
);

-- 3. turnos
CREATE TABLE IF NOT EXISTS public.turnos (
    id_turno SERIAL PRIMARY KEY,
    tipo_turno VARCHAR NOT NULL,
    hora_inicio TIME,
    hora_fin TIME,
    cant_horas NUMERIC,
    solo_semana BOOLEAN DEFAULT FALSE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE
);

-- 4. datos_personales
CREATE TABLE IF NOT EXISTS public.datos_personales (
    id_agente SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    dni TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    domicilio TEXT,
    fecha_nacimiento DATE,
    fecha_alta DATE,
    fecha_baja DATE,
    cohorte INTEGER,
    activo BOOLEAN DEFAULT TRUE
);

-- 5. planificacion
CREATE TABLE IF NOT EXISTS public.planificacion (
    id_plani SERIAL PRIMARY KEY,
    id_dia INTEGER NOT NULL REFERENCES public.dias(id_dia),
    id_turno INTEGER NOT NULL REFERENCES public.turnos(id_turno),
    grupo TEXT,
    lugar TEXT,
    cant_horas NUMERIC,
    cant_visit INTEGER,
    cant_residentes_plan INTEGER NOT NULL DEFAULT 0,
    usa_horario_custom BOOLEAN DEFAULT FALSE,
    hora_inicio TIME,
    hora_fin TIME,
    motivo_horario_custom TEXT,
    plani_notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. visitas_grupales
CREATE TABLE IF NOT EXISTS public.visitas_grupales (
    id_visita SERIAL PRIMARY KEY,
    id_coeficiente INTEGER REFERENCES public.config_visitas_coeficientes(id_coeficiente),
    id_plani_asignado INTEGER REFERENCES public.planificacion(id_plani),
    nombre_institucion TEXT NOT NULL,
    cantidad_personas INTEGER NOT NULL,
    nombre_referente TEXT,
    telefono_referente TEXT,
    email_referente TEXT,
    requiere_accesibilidad BOOLEAN DEFAULT FALSE,
    observaciones_grupo TEXT,
    estado TEXT,
    email_confirmacion_enviado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. convocatoria
CREATE TABLE IF NOT EXISTS public.convocatoria (
    id_convocatoria SERIAL PRIMARY KEY,
    id_agente INTEGER NOT NULL REFERENCES public.datos_personales(id_agente),
    id_plani INTEGER NOT NULL REFERENCES public.planificacion(id_plani),
    id_turno INTEGER NOT NULL REFERENCES public.turnos(id_turno),
    fecha_convocatoria DATE NOT NULL,
    estado TEXT,
    id_convocatoria_origen INTEGER,
    motivo_cambio TEXT,
    turno_cancelado BOOLEAN DEFAULT FALSE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_modificacion TEXT
);

-- DUMMY SEED DATA TO SATISFY FOREIGN KEY CONSTRAINTS

INSERT INTO public.dias (id_dia, fecha, dia, mes, anio, numero_dia_semana, es_feriado, descripcion_feriado)
VALUES 
  (457, '2026-04-02', 2, 4, 2026, 4, FALSE, ''),
  (458, '2026-04-03', 3, 4, 2026, 5, FALSE, ''),
  (492, '2026-05-07', 7, 5, 2026, 4, FALSE, ''),
  (493, '2026-05-08', 8, 5, 2026, 5, FALSE, '')
ON CONFLICT (id_dia) DO NOTHING;

INSERT INTO public.turnos (id_turno, tipo_turno, hora_inicio, hora_fin, cant_horas, solo_semana, descripcion, activo)
VALUES 
  (3, 'Mañana', '09:00:00', '13:00:00', 4, TRUE, 'Turno Mañana', TRUE),
  (4, 'Tarde', '14:00:00', '18:00:00', 4, TRUE, 'Turno Tarde', TRUE)
ON CONFLICT (id_turno) DO NOTHING;

INSERT INTO public.config_visitas_coeficientes (id_coeficiente, nombre_categoria, rango_edad_texto, valor, activo)
VALUES 
  (1, 'Jardín 1', '1-3 años', 1.50, TRUE),
  (2, 'Jardín 2', '3-5 años', 1.50, TRUE),
  (3, 'Primaria 1', '6-8 años', 1.35, TRUE),
  (4, 'Primaria 2', '8-10 años', 1.00, TRUE),
  (5, 'Primaria 3', '10-12 años', 1.00, TRUE),
  (6, 'Secundaria', '13-16 años', 1.00, TRUE),
  (7, 'Adultos', '+16 años', 1.00, TRUE)
ON CONFLICT (id_coeficiente) DO NOTHING;
