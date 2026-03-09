CREATE OR REPLACE VIEW "public"."vista_disponibilidad_visitas" AS 
 SELECT p.id_plani,
    d.fecha,
    d.mes,
    d.anio,
    d.numero_dia_semana,
    t.id_turno,
    t.tipo_turno,
    t.hora_inicio,
    t.hora_fin,
    120 AS cupo_total,
    COALESCE(sum(
        CASE
            WHEN ((av.estado)::text = ANY (ARRAY[('asignado'::character varying)::text, ('confirmado'::character varying)::text])) THEN av.cupo_calculado
            ELSE (0)::numeric
        END), (0)::numeric) AS cupo_ocupado_firme,
    COALESCE(sum(
        CASE
            WHEN ((av.estado)::text = 'en_espera'::text) THEN av.cupo_calculado
            ELSE (0)::numeric
        END), (0)::numeric) AS cupo_en_espera,
    ((120)::numeric - COALESCE(sum(
        CASE
            WHEN ((av.estado)::text = ANY (ARRAY[('asignado'::character varying)::text, ('confirmado'::character varying)::text])) THEN av.cupo_calculado
            ELSE (0)::numeric
        END), (0)::numeric)) AS cupo_disponible,
        CASE
            WHEN (((120)::numeric - COALESCE(sum(
            CASE
                WHEN ((av.estado)::text = ANY (ARRAY[('asignado'::character varying)::text, ('confirmado'::character varying)::text])) THEN av.cupo_calculado
                ELSE (0)::numeric
            END), (0)::numeric)) > (15)::numeric) THEN 'verde'::text
            WHEN (((120)::numeric - COALESCE(sum(
            CASE
                WHEN ((av.estado)::text = ANY (ARRAY[('asignado'::character varying)::text, ('confirmado'::character varying)::text])) THEN av.cupo_calculado
                ELSE (0)::numeric
            END), (0)::numeric)) >= ('-15'::integer)::numeric) THEN 'amarillo'::text
            ELSE 'rojo'::text
        END AS semaforo,
    ( SELECT count(*) AS count
           FROM convocatoria c
          WHERE ((c.id_plani = p.id_plani) AND ((c.estado)::text = 'vigente'::text))) AS residentes_convocados
   FROM ((planificacion p
     JOIN dias d ON ((p.id_dia = d.id_dia)))
     JOIN turnos t ON ((p.id_turno = t.id_turno)))
     LEFT JOIN asignaciones_visita av ON (((av.id_plani = p.id_plani) AND ((av.estado)::text <> ALL (ARRAY[('cancelado'::character varying)::text, ('duplicado'::character varying)::text]))))
  WHERE (t.id_turno = ANY (ARRAY[3, 4]))
  GROUP BY p.id_plani, d.fecha, d.mes, d.anio, d.numero_dia_semana, t.id_turno, t.tipo_turno, t.hora_inicio, t.hora_fin;