import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SlotDisponibilidad, AsignacionVisita, Coeficiente, SeguimientoLlamado, SolicitudPendiente } from '@/lib/types-visitas';

const SOLICITUDES_ACTIVE_FROM = import.meta.env.VITE_SOLICITUDES_ACTIVE_FROM
  ? new Date(import.meta.env.VITE_SOLICITUDES_ACTIVE_FROM)
  : new Date(`${new Date().getFullYear()}-01-01T00:00:00-03:00`);

function normalizeSolicitud(row: SolicitudPendiente): SolicitudPendiente {
  return row;
}

function getSolicitudMarcaTemporal(row: SolicitudPendiente) {
  return row.marca_temporal || row.created_at || null;
}

function isSolicitudActiva(row: SolicitudPendiente) {
  const estado = (row.estado_actual || '').trim().toLowerCase();
  const marca = getSolicitudMarcaTemporal(row);
  if (estado !== 'pendiente' || !marca) return false;
  return new Date(marca) >= SOLICITUDES_ACTIVE_FROM;
}

export function useDisponibilidad(anio?: number) {
  return useQuery({
    queryKey: ['disponibilidad-visitas', anio],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vista_disponibilidad_visitas' as any)
        .select('*')
        .eq('anio', anio || new Date().getFullYear())
        .order('fecha')
        .order('id_turno');
      if (error) throw error;
      return (data || []) as unknown as SlotDisponibilidad[];
    },
  });
}

export function useAsignaciones() {
  return useQuery({
    queryKey: ['asignaciones-visita'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asignaciones_visita' as any)
        .select('*, seguimiento_llamados_visita(count)')
        .order('created_at', { ascending: false });
      if (error) throw error;

      return (data || []).map(row => ({
        ...row,
        cantidad_llamados: row.seguimiento_llamados_visita && row.seguimiento_llamados_visita.length > 0
          ? row.seguimiento_llamados_visita[0].count
          : 0
      })) as unknown as AsignacionVisita[];
    },
  });
}

export function useCoeficientes() {
  return useQuery({
    queryKey: ['coeficientes-visitas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('config_visitas_coeficientes')
        .select('*')
        .eq('activo', true)
        .order('id_coeficiente');
      if (error) throw error;
      return (data || []) as unknown as Coeficiente[];
    },
  });
}

export function useSolicitudesPendientes() {
  return useQuery({
    queryKey: ['solicitudes-pendientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('solicitudes' as any)
        .select('*')
        // Estado viene del formulario y puede variar (Pendiente/pendiente/etc).
        // Ilike lo hace case-insensitive y evita que "queden" pendientes tras procesar.
        .ilike('estado_actual', 'pendiente%')
        .order('marca_temporal', { ascending: false });
      if (error) throw error;

      return (data || [])
        .filter((row): row is SolicitudPendiente => Boolean(row))
        .filter(isSolicitudActiva)
        .map(normalizeSolicitud);
    },
  });
}

export function useCrearAsignacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (asignacion: Partial<AsignacionVisita>) => {
      const { data, error } = await supabase
        .from('asignaciones_visita' as any)
        .insert(asignacion as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
      qc.invalidateQueries({ queryKey: ['disponibilidad-visitas'] });
    },
  });
}

export function useProcesarSolicitud() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      solicitudId,
      assignment,
      estadoSolicitud,
    }: {
      solicitudId: string;
      assignment: Partial<AsignacionVisita>;
      estadoSolicitud: string;
    }) => {
      // 1. INSERT la asignación (bloquea si falla)
      const { data, error } = await supabase
        .from('asignaciones_visita' as any)
        .insert(assignment as any)
        .select()
        .single();
      if (error) throw error;

      // 2. UPDATE el estado de la solicitud origen (non-blocking: warn si falla pero no bloquea)
      const { error: updateError } = await supabase
        .from('solicitudes' as any)
        .update({ estado_actual: estadoSolicitud } as any)
        .eq('id', solicitudId);
      if (updateError) {
        console.warn('No se pudo actualizar el estado de la solicitud:', updateError.message);
        // No lanzamos error para que el flujo continue y la UI se actualice
      }

      return data;
    },
    onMutate: async ({ solicitudId }) => {
      // Optimistic update: remover el item del cache inmediatamente
      await qc.cancelQueries({ queryKey: ['solicitudes-pendientes'] });
      const previousData = qc.getQueryData<any[]>(['solicitudes-pendientes']);
      qc.setQueryData(['solicitudes-pendientes'], (old: any[]) =>
        (old || []).filter((s: any) => s.id !== solicitudId)
      );
      return { previousData };
    },
    onError: (_, __, context: any) => {
      // Rollback si el INSERT falla
      if (context?.previousData) {
        qc.setQueryData(['solicitudes-pendientes'], context.previousData);
      }
    },
    onSettled: () => {
      // Siempre refrescar al terminar (exitoso o no)
      qc.invalidateQueries({ queryKey: ['solicitudes-pendientes'] });
      qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
      qc.invalidateQueries({ queryKey: ['disponibilidad-visitas'] });
    },
  });
}

export function useActualizarEstado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, estado, id_plani }: { id: number; estado: string; id_plani?: number | null }) => {
      const payload: Record<string, any> = { estado };
      if (id_plani !== undefined) payload.id_plani = id_plani;
      const { error } = await supabase
        .from('asignaciones_visita' as any)
        .update(payload as any)
        .eq('id_asignacion', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
      qc.invalidateQueries({ queryKey: ['disponibilidad-visitas'] });
    },
  });
}

export function useSeguimientoLlamados(id_asignacion?: number | null, id_solicitud?: string | null) {
  return useQuery({
    queryKey: ['seguimiento-llamados', id_asignacion, id_solicitud],
    queryFn: async () => {
      if (!id_asignacion && !id_solicitud) return [];
      const query = supabase.from('seguimiento_llamados_visita' as any).select('*').order('fecha_hora', { ascending: true });
      
      if (id_asignacion) {
        query.eq('id_asignacion', id_asignacion);
      } else if (id_solicitud) {
        query.eq('id_solicitud', id_solicitud);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as SeguimientoLlamado[];
    },
    enabled: !!id_asignacion || !!id_solicitud,
  });
}

export function useCrearSeguimientoLlamado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (llamado: Partial<SeguimientoLlamado>) => {
      const { data, error } = await supabase
        .from('seguimiento_llamados_visita' as any)
        .insert(llamado as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['seguimiento-llamados', variables.id_asignacion, variables.id_solicitud] });
      // Invalidate general ones to refresh counts
      qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
      qc.invalidateQueries({ queryKey: ['solicitudes-pendientes'] });
    },
  });
}

export interface PlantillaCorreo {
  tipo_correo: string;
  asunto: string;
  cuerpo: string;
}

export function usePlantillasCorreo() {
  return useQuery({
    queryKey: ['plantillas-correo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('config_plantillas_correo' as any)
        .select('*');
      if (error) throw error;
      return (data || []) as PlantillaCorreo[];
    },
  });
}

export function useUpdatePlantillaCorreo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plantilla: PlantillaCorreo) => {
      const { data, error } = await supabase
        .from('config_plantillas_correo' as any)
        .upsert(plantilla as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plantillas-correo'] });
    },
  });
}
