
-- Insert planificacion dummy for visits (April 2,3 + May 7,8 × morning,afternoon)
INSERT INTO planificacion (id_dia, id_turno, cant_residentes_plan, cant_visit, plani_notas)
VALUES 
  (457, 3, 0, 120, 'Turno visita - Abril Jueves Mañana'),
  (457, 4, 0, 120, 'Turno visita - Abril Jueves Tarde'),
  (458, 3, 0, 120, 'Turno visita - Abril Viernes Mañana'),
  (458, 4, 0, 120, 'Turno visita - Abril Viernes Tarde'),
  (492, 3, 0, 120, 'Turno visita - Mayo Jueves Mañana'),
  (492, 4, 0, 120, 'Turno visita - Mayo Jueves Tarde'),
  (493, 3, 0, 120, 'Turno visita - Mayo Viernes Mañana'),
  (493, 4, 0, 120, 'Turno visita - Mayo Viernes Tarde');

-- Insert coeficientes
INSERT INTO config_visitas_coeficientes (nombre_categoria, rango_edad_texto, valor, activo)
VALUES 
  ('Jardín (3-5 años)', '3-5 años', 1.50, true),
  ('Primaria baja (6-8 años)', '6-8 años', 1.35, true),
  ('Primaria alta (8-10 años)', '8-10 años', 1.00, true),
  ('Primaria alta (10-12 años)', '10-12 años', 1.00, true),
  ('Secundaria (13-16 años)', '13-16 años', 1.00, true),
  ('Adultos (+16 años)', '+16 años', 1.00, true)
ON CONFLICT DO NOTHING;
