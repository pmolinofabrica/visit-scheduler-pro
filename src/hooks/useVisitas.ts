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

const SOLICITUD_MATCH_MIN_SCORE = 60;
const SOLICITUD_MATCH_MIN_MARGIN = 10;

function normalizeComparableText(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function normalizeComparablePhone(value?: string | null) {
  return (value || '').replace(/\D/g, '');
}

function scoreSolicitudCandidate(candidate: SolicitudPendiente, asignacion: Partial<AsignacionVisita>) {
  let score = 0;

  const institucionAsignacion = normalizeComparableText(asignacion.nombre_institucion);
  const institucionSolicitud = normalizeComparableText(candidate.nombre_institucion);
  if (institucionAsignacion && institucionSolicitud) {
    if (institucionAsignacion === institucionSolicitud) score += 35;
    else if (
      institucionSolicitud.includes(institucionAsignacion) ||
      institucionAsignacion.includes(institucionSolicitud)
    ) score += 15;
  }

  const referenteAsignacion = normalizeComparableText(asignacion.nombre_referente);
  const referenteSolicitud = normalizeComparableText(candidate.nombre_referente);
  if (referenteAsignacion && referenteSolicitud) {
    if (referenteAsignacion === referenteSolicitud) score += 25;
    else if (
      referenteSolicitud.includes(referenteAsignacion) ||
      referenteAsignacion.includes(referenteSolicitud)
    ) score += 10;
  }

  const emailAsignacion = normalizeComparableText(asignacion.email_referente);
  const emailSolicitud = normalizeComparableText(candidate.email_referente);
  if (emailAsignacion && emailSolicitud && emailAsignacion === emailSolicitud) {
    score += 35;
  }

  const telReferenteAsignacion = normalizeComparablePhone(asignacion.telefono_referente);
  const telReferenteSolicitud = normalizeComparablePhone(candidate.telefono_referente);
  if (telReferenteAsignacion && telReferenteSolicitud && telReferenteAsignacion === telReferenteSolicitud) {
    score += 30;
  }

  const telInstitucionAsignacion = normalizeComparablePhone(asignacion.telefono_institucion);
  const telInstitucionSolicitud = normalizeComparablePhone(candidate.telefono_institucion);
  if (telInstitucionAsignacion && telInstitucionSolicitud && telInstitucionAsignacion === telInstitucionSolicitud) {
    score += 20;
  }

  const empresaAsignacion = normalizeComparableText(asignacion.nombre_empresa);
  const empresaSolicitud = normalizeComparableText(candidate.nombre_empresa_organizacion);
  if (empresaAsignacion && empresaSolicitud && empresaAsignacion === empresaSolicitud) {
    score += 10;
  }

  const rangoAsignacion = normalizeComparableText(asignacion.rango_etario);
  const rangoSolicitud = normalizeComparableText(candidate.rango_etario);
  if (rangoAsignacion && rangoSolicitud && rangoAsignacion === rangoSolicitud) {
    score += 10;
  }

  if (
    typeof candidate.cantidad_visitantes === 'number' &&
    typeof asignacion.cantidad_personas_original === 'number' &&
    candidate.cantidad_visitantes === asignacion.cantidad_personas_original
  ) {
    score += 15;
  }

  if (normalizeComparableText(candidate.estado_actual) !== 'pendiente') {
    score += 5;
  }

  return score;
}

function pickSolicitudCandidate(candidates: SolicitudPendiente[], asignacion: Partial<AsignacionVisita>) {
  const ranked = candidates
    .map((candidate) => ({
      candidate,
      score: scoreSolicitudCandidate(candidate, asignacion),
      timestamp: new Date(candidate.marca_temporal || candidate.created_at || 0).getTime(),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);

  const best = ranked[0];
  const second = ranked[1];
  if (!best || best.score < SOLICITUD_MATCH_MIN_SCORE) return null;
  if (second && best.score - second.score < SOLICITUD_MATCH_MIN_MARGIN) return null;
  return best.candidate;
}

function mapAsignacionEstadoToSolicitudEstado(estado: string) {
  switch (estado) {
    case 'pendiente':
      return 'pendiente';
    case 'cancelado':
      return 'Cancelado';
    case 'confirmado':
      return 'Confirmado';
    case 'en_espera':
      return 'En espera';
    case 'duplicado':
      return 'Duplicado';
    case 'asignado':
    default:
      return 'Asignado';
  }
}

async function syncSolicitudFromAsignacion(asignacion: Partial<AsignacionVisita>, estado: string) {
  const filters = [
    asignacion.nombre_institucion ? `nombre_institucion.ilike.%${asignacion.nombre_institucion.trim()}%` : null,
    asignacion.nombre_referente ? `nombre_referente.eq.${asignacion.nombre_referente}` : null,
    asignacion.email_referente ? `email_referente.eq.${asignacion.email_referente}` : null,
    asignacion.telefono_referente ? `telefono_referente.eq.${asignacion.telefono_referente}` : null,
    asignacion.telefono_institucion ? `telefono_institucion.eq.${asignacion.telefono_institucion}` : null,
  ].filter(Boolean);

  if (filters.length === 0) return;

  const { data: candidates, error: candidatesError } = await supabase
    .from('solicitudes' as any)
    .select('*')
    .or(filters.join(','))
    .limit(25);
  if (candidatesError) throw candidatesError;

  const matchingSolicitud = pickSolicitudCandidate((candidates || []) as SolicitudPendiente[], asignacion);
  if (!matchingSolicitud) return;

  const now = new Date().toISOString();
  const payload: Record<string, any> = {
    estado_actual: mapAsignacionEstadoToSolicitudEstado(estado),
  };

  if (estado === 'pendiente' || estado === 'cancelado') {
    payload.marca_temporal = now;
  }

  const { error: updateError } = await supabase
    .from('solicitudes' as any)
    .update(payload as any)
    .eq('id', matchingSolicitud.id);
  if (updateError) throw updateError;
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
      const { data: asignacionActual, error: fetchError } = await supabase
        .from('asignaciones_visita' as any)
        .select('*')
        .eq('id_asignacion', id)
        .single();
      if (fetchError) throw fetchError;

      const payload: Record<string, any> = { estado };
      if (id_plani !== undefined) payload.id_plani = id_plani;
      const { error } = await supabase
        .from('asignaciones_visita' as any)
        .update(payload as any)
        .eq('id_asignacion', id);
      if (error) throw error;

      await syncSolicitudFromAsignacion({
        ...asignacionActual,
        ...payload,
      }, estado);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
      qc.invalidateQueries({ queryKey: ['disponibilidad-visitas'] });
      qc.invalidateQueries({ queryKey: ['solicitudes-pendientes'] });
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

export function useEliminarSeguimientoLlamado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id_llamado: number) => {
      const { error } = await supabase
        .from('seguimiento_llamados_visita' as any)
        .delete()
        .eq('id_llamado', id_llamado);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seguimiento-llamados'] });
      qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
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
        .upsert(plantilla as any, { onConflict: 'tipo_correo' })
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
