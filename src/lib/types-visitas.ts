export interface SlotDisponibilidad {
  id_plani: number;
  fecha: string;
  mes: number;
  anio: number;
  numero_dia_semana: number;
  id_turno: number;
  tipo_turno: string;
  hora_inicio: string;
  hora_fin: string;
  cupo_total: number;
  cupo_ocupado_firme: number;
  cupo_en_espera: number;
  cupo_disponible: number;
  semaforo: 'verde' | 'amarillo' | 'rojo';
  residentes_convocados?: number;
}

export type AsignacionEstado = 'pendiente' | 'asignado' | 'en_espera' | 'confirmado' | 'cancelado' | 'duplicado' | 'corregido';

export interface AsignacionVisita {
  id_asignacion: number;
  id_visita: number | null;
  id_plani: number | null;
  estado: AsignacionEstado;
  cantidad_personas_original: number;
  id_coeficiente: number | null;
  coeficiente_aplicado: number;
  cupo_calculado: number;
  nombre_institucion: string | null;
  nombre_referente: string | null;
  email_referente: string | null;
  telefono_referente: string | null;
  telefono_institucion: string | null;
  nombre_empresa: string | null;
  rango_etario: string | null;
  mes_solicitado: number | null;
  agente_asigno: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  planificacion?: {
    fecha: string;
    tipo_turno: string;
    hora_inicio: string;
    hora_fin: string;
  };
}

export interface Coeficiente {
  id_coeficiente: number;
  nombre_categoria: string;
  rango_edad_texto: string | null;
  valor: number;
  activo: boolean;
}

export const ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  asignado: 'Asignado',
  en_espera: 'En espera',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
  duplicado: 'Duplicado',
  corregido: 'Corregido',
};

export const DIA_SEMANA: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

export const MES_NOMBRE: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
  5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

export const MES_NOMBRE_A_NUMERO: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

export function parseMesVisitaPreferido(mes?: string | null) {
  if (!mes) return null;
  const normalized = mes
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  return MES_NOMBRE_A_NUMERO[normalized] || null;
}

export interface SolicitudPendiente {
  id: string;
  agenda_amplia: string | null;
  cantidad_visitantes: number | null;
  cargo_institucion: string | null;
  coeficiente_calculado: number | null;
  comentarios_observaciones: string | null;
  created_at: string | null;
  departamento: string | null;
  dias_turnos_preferencia: string | null;
  direccion_email: string | null;
  disponibilidad_llamados: string | null;
  email_contacto_coordinador: string | null;
  email_referente: string | null;
  estado_actual: string | null;
  marca_temporal: string | null;
  mes_visita_preferido: string | null;
  nombre_coordinador_viaje: string | null;
  nombre_empresa_organizacion: string | null;
  nombre_institucion: string | null;
  nombre_referente: string | null;
  provincia: string | null;
  quien_coordina: string | null;
  rango_etario: string | null;
  requerimientos_accesibilidad: string | null;
  telefono_contacto_coordinador: string | null;
  telefono_institucion: string | null;
  telefono_referente: string | null;
  tipo_institucion: string | null;
}

export interface SeguimientoLlamado {
  id_llamado: number;
  id_asignacion: number;
  fecha_hora: string;
  agente: string | null;
  atendio: boolean | null;
  observaciones: string | null;
  created_at: string;
}
