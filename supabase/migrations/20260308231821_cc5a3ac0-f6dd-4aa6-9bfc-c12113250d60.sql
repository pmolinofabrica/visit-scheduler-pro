
-- Update cant_residentes_plan to 18 for all visitas planificacion
UPDATE planificacion 
SET cant_residentes_plan = 18 
WHERE id_turno IN (3, 4) 
  AND id_dia IN (
    SELECT id_dia FROM dias 
    WHERE anio = 2026 AND mes IN (4,5) 
    AND numero_dia_semana IN (4,5) 
    AND es_feriado = false
  );

-- Insert 30 dummy asignaciones_visita (schools requesting April and May visits)
INSERT INTO asignaciones_visita 
  (estado, cantidad_personas_original, id_coeficiente, coeficiente_aplicado, cupo_calculado, 
   nombre_institucion, nombre_referente, email_referente, telefono_referente, 
   telefono_institucion, rango_etario, mes_solicitado) 
VALUES
  ('pendiente', 45, 4, 1.00, 45, 'Escuela Primaria Nº 12 Belgrano', 'María López', 'mlopez@esc12.edu.ar', '011-4555-1201', '011-4555-1200', '8-10 años', 4),
  ('pendiente', 30, 6, 1.00, 30, 'Instituto San Martín', 'Carlos Ruiz', 'cruiz@sanmartin.edu.ar', '011-4555-1301', '011-4555-1300', '13-16 años', 4),
  ('pendiente', 60, 2, 1.50, 90, 'Jardín Arco Iris', 'Ana García', 'agarcia@arcoiris.edu.ar', '011-4555-1401', '011-4555-1400', '3-5 años', 4),
  ('pendiente', 25, 5, 1.00, 25, 'Colegio Nuestra Señora', 'Pedro Martínez', 'pmartinez@ns.edu.ar', '011-4555-1501', '011-4555-1500', '10-12 años', 4),
  ('pendiente', 80, 3, 1.35, 108, 'Escuela Nº 7 Sarmiento', 'Laura Fernández', 'lfernandez@esc7.edu.ar', '011-4555-1601', '011-4555-1600', '6-8 años', 4),
  ('pendiente', 35, 7, 1.00, 35, 'Liceo Técnico Industrial', 'Roberto Díaz', 'rdiaz@liceo.edu.ar', '011-4555-1701', '011-4555-1700', '+16 años', 4),
  ('pendiente', 50, 1, 1.50, 75, 'Jardín Maternal Rayito de Sol', 'Silvia Morales', 'smorales@rayito.edu.ar', '011-4555-1801', '011-4555-1800', '1-3 años', 4),
  ('pendiente', 40, 4, 1.00, 40, 'Escuela Normal Superior Nº 3', 'Jorge Álvarez', 'jalvarez@normal3.edu.ar', '011-4555-1901', '011-4555-1900', '8-10 años', 4),
  ('pendiente', 55, 6, 1.00, 55, 'Colegio Nacional Buenos Aires', 'Marta Suárez', 'msuarez@cnba.edu.ar', '011-4555-2001', '011-4555-2000', '13-16 años', 4),
  ('pendiente', 28, 3, 1.35, 38, 'Escuela Primaria Nº 22', 'Diego Torres', 'dtorres@esc22.edu.ar', '011-4555-2101', '011-4555-2100', '6-8 años', 4),
  ('pendiente', 65, 5, 1.00, 65, 'Instituto Educativo del Sur', 'Patricia Romero', 'promero@iesur.edu.ar', '011-4555-2201', '011-4555-2200', '10-12 años', 4),
  ('pendiente', 42, 2, 1.50, 63, 'Jardín de Infantes Nº 5', 'Claudia Herrera', 'cherrera@jardin5.edu.ar', '011-4555-2301', '011-4555-2300', '3-5 años', 4),
  ('pendiente', 38, 7, 1.00, 38, 'Escuela Técnica Nº 1', 'Gustavo Méndez', 'gmendez@et1.edu.ar', '011-4555-2401', '011-4555-2400', '+16 años', 4),
  ('pendiente', 70, 4, 1.00, 70, 'Colegio San José', 'Verónica Castro', 'vcastro@sanjose.edu.ar', '011-4555-2501', '011-4555-2500', '8-10 años', 4),
  ('pendiente', 20, 1, 1.50, 30, 'Jardín Maternal Los Peques', 'Andrea Figueroa', 'afigueroa@lospeques.edu.ar', '011-4555-2601', '011-4555-2600', '1-3 años', 4),
  ('pendiente', 48, 6, 1.00, 48, 'Escuela Secundaria Nº 15', 'Fernando Acosta', 'facosta@esc15.edu.ar', '011-4555-2701', '011-4555-2700', '13-16 años', 5),
  ('pendiente', 33, 3, 1.35, 45, 'Escuela Primaria Nº 8 Mitre', 'Luciana Paz', 'lpaz@esc8.edu.ar', '011-4555-2801', '011-4555-2800', '6-8 años', 5),
  ('pendiente', 55, 5, 1.00, 55, 'Instituto Parroquial San Pedro', 'Héctor Gómez', 'hgomez@sanpedro.edu.ar', '011-4555-2901', '011-4555-2900', '10-12 años', 5),
  ('pendiente', 40, 2, 1.50, 60, 'Jardín Nº 10 Mariposas', 'Roxana Villalba', 'rvillalba@jardin10.edu.ar', '011-4555-3001', '011-4555-3000', '3-5 años', 5),
  ('pendiente', 75, 4, 1.00, 75, 'Colegio Alemán', 'Martín Schuster', 'mschuster@colaleman.edu.ar', '011-4555-3101', '011-4555-3100', '8-10 años', 5),
  ('pendiente', 22, 7, 1.00, 22, 'Escuela para Adultos Nº 3', 'Graciela Luna', 'gluna@epa3.edu.ar', '011-4555-3201', '011-4555-3200', '+16 años', 5),
  ('pendiente', 50, 1, 1.50, 75, 'Jardín Maternal Dulce Hogar', 'Natalia Ríos', 'nrios@dulcehogar.edu.ar', '011-4555-3301', '011-4555-3300', '1-3 años', 5),
  ('pendiente', 36, 3, 1.35, 49, 'Escuela Nº 14 Rivadavia', 'Oscar Benítez', 'obenitez@esc14.edu.ar', '011-4555-3401', '011-4555-3400', '6-8 años', 5),
  ('pendiente', 60, 6, 1.00, 60, 'Liceo Militar', 'Raúl Sánchez', 'rsanchez@liceomil.edu.ar', '011-4555-3501', '011-4555-3500', '13-16 años', 5),
  ('pendiente', 44, 5, 1.00, 44, 'Instituto Santa Clara', 'Beatriz Molina', 'bmolina@staclara.edu.ar', '011-4555-3601', '011-4555-3600', '10-12 años', 5),
  ('pendiente', 30, 2, 1.50, 45, 'Jardín de Infantes Arcoíris II', 'Daniela Vargas', 'dvargas@arcoiris2.edu.ar', '011-4555-3701', '011-4555-3700', '3-5 años', 5),
  ('pendiente', 85, 4, 1.00, 85, 'Escuela Primaria Nº 30', 'Emilio Paredes', 'eparedes@esc30.edu.ar', '011-4555-3801', '011-4555-3800', '8-10 años', 5),
  ('pendiente', 26, 1, 1.50, 39, 'Jardín Maternal Estrellita', 'Cecilia Navarro', 'cnavarro@estrellita.edu.ar', '011-4555-3901', '011-4555-3900', '1-3 años', 5),
  ('pendiente', 58, 7, 1.00, 58, 'Centro Educativo para Adultos', 'Adrián Peralta', 'aperalta@cea.edu.ar', '011-4555-4001', '011-4555-4000', '+16 años', 5),
  ('pendiente', 47, 3, 1.35, 64, 'Escuela Primaria Nº 18 Brown', 'Valeria Sosa', 'vsosa@esc18.edu.ar', '011-4555-4101', '011-4555-4100', '6-8 años', 5);
