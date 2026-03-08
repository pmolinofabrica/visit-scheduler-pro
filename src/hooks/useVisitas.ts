import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SlotDisponibilidad, AsignacionVisita, Coeficiente, SeguimientoLlamado } from '@/lib/types-visitas';

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
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as AsignacionVisita[];
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

export function useActualizarEstado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, estado }: { id: number; estado: string }) => {
      const { error } = await supabase
        .from('asignaciones_visita' as any)
        .update({ estado } as any)
        .eq('id_asignacion', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
      qc.invalidateQueries({ queryKey: ['disponibilidad-visitas'] });
    },
  });
}
