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
}

export interface AsignacionVisita {
  id_asignacion: number;
  id_visita: number | null;
  id_plani: number | null;
  estado: 'pendiente' | 'asignado' | 'en_espera' | 'confirmado' | 'cancelado' | 'duplicado' | 'corregido';
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

export interface SeguimientoLlamado {
  id_llamado: number;
  id_asignacion: number;
  fecha_hora: string;
  agente: string | null;
  atendio: boolean | null;
  created_at: string;
}
