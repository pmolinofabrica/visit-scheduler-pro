import { useMemo, useState } from 'react';
import { useAsignaciones, useDisponibilidad, useSeguimientoLlamados } from '@/hooks/useVisitas';
import { DIA_SEMANA, MES_NOMBRE } from '@/lib/types-visitas';
import type { AsignacionVisita } from '@/lib/types-visitas';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Calendar, Users, Building, Phone, PhoneOff, Mail, Sun, Moon, Pencil, Trash2, Copy, ChevronDown } from 'lucide-react';
import { isToday, isTomorrow, isPast } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FormModificacion } from './FormModificacion';
import { PanelLlamado } from './PanelLlamado';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

function LlamadoIndicator({ idAsignacion }: { idAsignacion: number }) {
  const { data: llamados = [] } = useSeguimientoLlamados(idAsignacion);
  if (llamados.length === 0) return null;
  const lastCall = llamados[llamados.length - 1];
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm',
      lastCall.atendio
        ? 'text-semaforo-verde bg-semaforo-verde/10'
        : 'text-semaforo-rojo bg-semaforo-rojo/10'
    )}>
      {lastCall.atendio ? <Phone className="h-2.5 w-2.5" /> : <PhoneOff className="h-2.5 w-2.5" />}
      {lastCall.atendio ? 'Atendió' : 'No atendió'}
    </span>
  );
}

export function TablaConfirmados() {
  const qc = useQueryClient();
  const [editingAsignacion, setEditingAsignacion] = useState<AsignacionVisita | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [callingId, setCallingId] = useState<number | null>(null);

  const { data: asignaciones = [], isLoading } = useAsignaciones();
  const { data: slots = [] } = useDisponibilidad(new Date().getFullYear());

  const slotMap = useMemo(() => {
    const m: Record<number, any> = {};
    slots.forEach(s => { m[s.id_plani] = s; });
    return m;
  }, [slots]);

  // Only confirmed + assigned + cancelled with a slot
  const confirmadas = useMemo(() => {
    return asignaciones
      .filter(a => (a.estado === 'confirmado' || a.estado === 'asignado' || a.estado === 'cancelado') && a.id_plani)
      .sort((a, b) => {
        const sa = a.id_plani ? slotMap[a.id_plani] : null;
        const sb = b.id_plani ? slotMap[b.id_plani] : null;
        if (!sa || !sb) return 0;
        const dateComp = sa.fecha.localeCompare(sb.fecha);
        if (dateComp !== 0) return dateComp;
        return sa.id_turno - sb.id_turno;
      });
  }, [asignaciones, slotMap]);

  // Group by date, then by turno
  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, AsignacionVisita[]>>();
    confirmadas.forEach(a => {
      const slot = slotMap[a.id_plani!];
      if (!slot) return;
      const dateKey = slot.fecha;
      const turnoKey = slot.tipo_turno || 'Sin turno';
      if (!map.has(dateKey)) map.set(dateKey, new Map());
      const turnoMap = map.get(dateKey)!;
      if (!turnoMap.has(turnoKey)) turnoMap.set(turnoKey, []);
      turnoMap.get(turnoKey)!.push(a);
    });
    return map;
  }, [confirmadas, slotMap]);

  if (isLoading) return <p className="text-muted-foreground p-4">Cargando...</p>;

  const handleGuardarModificacion = async (formData: Partial<AsignacionVisita>, duplicar: boolean) => {
    if (!editingAsignacion) return;
    setSavingEdit(true);
    try {
      const updateData = {
        ...formData,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('asignaciones_visita' as any)
        .update(updateData as any)
        .eq('id_asignacion', editingAsignacion.id_asignacion);

      if (error) throw error;

      if (duplicar) {
        const { id_asignacion, created_at, updated_at, ...rest } = editingAsignacion;
        const insertData = { ...rest, ...formData, estado: 'pendiente', id_plani: null };
        delete (insertData as any).planificacion;
        const { error: errorInsert } = await supabase
          .from('asignaciones_visita' as any)
          .insert([insertData as any]);
        
        if (errorInsert) throw errorInsert;
        toast.success('Registro duplicado (creado en estado Pendiente)');
      } else {
        toast.success('Solicitud modificada correctamente');
      }
      qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
      setEditingAsignacion(null);
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar modificación');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleEliminar = async (idAsig: number) => {
    if (!confirm('¿Estás seguro de que querés eliminar definitivamente este turno? Esta acción no se puede deshacer.')) return;
    try {
      const { error } = await supabase
        .from('asignaciones_visita' as any)
        .delete()
        .eq('id_asignacion', idAsig);
      if (error) throw error;
      toast.success('Turno eliminado permanentemente');
      qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
    } catch (e: any) {
      toast.error(e.message || 'Error al eliminar');
    }
  };

  const handleDuplicate = async (a: AsignacionVisita) => {
    try {
      const { id_asignacion, created_at, updated_at, planificacion, ...rest } = a as any;
      const insertData = { ...rest, estado: 'pendiente', id_plani: null };
      const { error } = await supabase.from('asignaciones_visita' as any).insert([insertData]);
      if (error) throw error;
      toast.success('Turno duplicado (enviado a pendientes)');
      qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
    } catch (e: any) {
      toast.error(e.message || 'Error al duplicar');
    }
  };

  const handleCambiarEstado = async (idAsig: number, nuevoEstado: string) => {
    try {
      const { error } = await supabase
        .from('asignaciones_visita' as any)
        .update({ estado: nuevoEstado, updated_at: new Date().toISOString() } as any)
        .eq('id_asignacion', idAsig);
      if (error) throw error;
      toast.success(`Estado cambiado a ${nuevoEstado === 'confirmado' ? 'Confirmado' : nuevoEstado === 'cancelado' ? 'Cancelado' : 'Asignado'}`);
      qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
    } catch (e: any) {
      toast.error(e.message || 'Error al cambiar estado');
    }
  };

  if (grouped.size === 0) {
    return <p className="py-8 text-center text-muted-foreground">No hay turnos confirmados, asignados o cancelados</p>;
  }

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([dateStr, turnoMap]) => {
        const date = new Date(dateStr + 'T12:00:00');
        const today = isToday(date);
        const tomorrow = isTomorrow(date);
        const past = isPast(date) && !today;
        const slot0 = Object.values(Object.fromEntries(turnoMap))[0]?.[0];
        const slotInfo = slot0?.id_plani ? slotMap[slot0.id_plani] : null;

        return (
          <div
            key={dateStr}
            className={cn(
              'rounded-xl border-2 overflow-hidden',
              today && 'border-primary shadow-lg',
              tomorrow && 'border-semaforo-verde/50',
              past && 'border-border opacity-70',
              !today && !tomorrow && !past && 'border-border'
            )}
          >
            {/* Date header */}
            <div className={cn(
              'px-4 py-3 flex items-center gap-3',
              today && 'bg-primary text-primary-foreground',
              tomorrow && 'bg-semaforo-verde/10',
              past && 'bg-muted',
              !today && !tomorrow && !past && 'bg-card'
            )}>
              <Calendar className="h-5 w-5 shrink-0" />
              <div className="flex-1">
                <span className="font-bold text-base">
                  {slotInfo ? DIA_SEMANA[slotInfo.numero_dia_semana] : ''}{' '}
                  {date.getDate()}/{MES_NOMBRE[date.getMonth() + 1]}
                </span>
                {today && <Badge className="ml-2 bg-primary-foreground text-primary text-[10px]">HOY</Badge>}
                {tomorrow && <Badge className="ml-2 bg-semaforo-verde text-primary-foreground text-[10px]">MAÑANA</Badge>}
                {past && <Badge variant="outline" className="ml-2 text-[10px]">PASADO</Badge>}
              </div>
            </div>

            {/* Turnos within this date */}
            <div className="divide-y">
              {Array.from(turnoMap.entries()).map(([turnoName, assigns]) => {
                const isMorning = turnoName.toLowerCase().includes('mañana') || turnoName.toLowerCase().includes('manana');
                const totalPersonas = assigns.reduce((s, a) => s + a.cantidad_personas_original, 0);
                const totalCupo = assigns.reduce((s, a) => s + a.cupo_calculado, 0);
                const slotRef = assigns[0]?.id_plani ? slotMap[assigns[0].id_plani] : null;

                return (
                  <div key={turnoName} className="px-4 py-3">
                    {/* Turno sub-header */}
                    <div className={cn(
                      'flex items-center gap-2 mb-3 px-3 py-2 rounded-lg',
                      isMorning ? 'bg-semaforo-amarillo/10 border border-semaforo-amarillo/30' : 'bg-espera/10 border border-espera/30'
                    )}>
                      {isMorning ? <Sun className="h-4 w-4 text-semaforo-amarillo" /> : <Moon className="h-4 w-4 text-espera" />}
                      <span className="font-semibold text-sm">{turnoName}</span>
                      {slotRef && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({slotRef.hora_inicio?.slice(0, 5)} - {slotRef.hora_fin?.slice(0, 5)})
                        </span>
                      )}
                      <div className="ml-auto flex gap-3 text-xs">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> {totalPersonas} pers.
                        </span>
                        <span className="font-mono font-bold">Cupo: {Math.round(totalCupo)}</span>
                        <Badge variant="outline" className="text-[10px]">{assigns.length} grupo{assigns.length > 1 ? 's' : ''}</Badge>
                      </div>
                    </div>

                    {/* Assignment cards */}
                    <div className="grid gap-2">
                      {assigns.map(a => (
                        <div
                          key={a.id_asignacion}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm',
                            a.estado === 'confirmado' 
                              ? 'bg-semaforo-verde/5 border-semaforo-verde/30' 
                              : a.estado === 'cancelado'
                              ? 'bg-semaforo-rojo/5 border-semaforo-rojo/30'
                              : 'bg-card border-border/50'
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="font-semibold truncate">{a.nombre_institucion || '—'}</span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className={cn(
                                    'text-[10px] shrink-0 inline-flex items-center gap-1 cursor-pointer rounded-sm px-1.5 py-0.5 font-medium transition-colors hover:opacity-80',
                                    a.estado === 'confirmado' ? 'bg-badge-confirmed text-primary-foreground' : a.estado === 'cancelado' ? 'bg-badge-cancelled text-primary-foreground' : 'bg-badge-assigned text-primary-foreground'
                                  )}>
                                    {a.estado === 'confirmado' ? '✔ Confirmado' : a.estado === 'cancelado' ? '❌ Cancelado' : '📋 Asignado'}
                                    <ChevronDown className="h-2.5 w-2.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="min-w-[140px]">
                                  <DropdownMenuItem
                                    onClick={() => handleCambiarEstado(a.id_asignacion, 'asignado')}
                                    className={cn('text-xs', a.estado === 'asignado' && 'font-bold bg-muted')}
                                  >
                                    📋 Asignado
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleCambiarEstado(a.id_asignacion, 'confirmado')}
                                    className={cn('text-xs', a.estado === 'confirmado' && 'font-bold bg-muted')}
                                  >
                                    ✔ Confirmado
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleCambiarEstado(a.id_asignacion, 'cancelado')}
                                    className={cn('text-xs', a.estado === 'cancelado' && 'font-bold bg-muted')}
                                  >
                                    ❌ Cancelado
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" /> {a.cantidad_personas_original} pers. (cupo {Math.round(a.cupo_calculado)})
                              </span>
                              {a.nombre_referente && <span>Ref: {a.nombre_referente}</span>}
                              {a.telefono_referente && (
                                <a href={`tel:${a.telefono_referente}`} className="flex items-center gap-0.5 text-primary hover:underline">
                                  <Phone className="h-3 w-3" /> {a.telefono_referente}
                                </a>
                              )}
                              {a.email_referente && (
                                <a href={`mailto:${a.email_referente}`} className="flex items-center gap-0.5 text-primary hover:underline">
                                  <Mail className="h-3 w-3" /> {a.email_referente}
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-2">
                              <LlamadoIndicator idAsignacion={a.id_asignacion} />
                              <span className="text-[10px] font-mono text-muted-foreground">#{a.id_asignacion}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-muted-foreground hover:text-semaforo-verde hover:bg-semaforo-verde/10"
                                onClick={() => setCallingId(a.id_asignacion)}
                                title="Registrar llamado"
                              >
                                <Phone className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => setEditingAsignacion(a)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => handleDuplicate(a)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => handleEliminar(a.id_asignacion)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <Dialog open={!!editingAsignacion} onOpenChange={(open) => !open && setEditingAsignacion(null)}>
        <DialogContent className="max-w-3xl border-0 p-0 overflow-hidden bg-transparent shadow-none">
          {editingAsignacion && (
             <FormModificacion
                asignacion={editingAsignacion}
                onSave={(data) => handleGuardarModificacion(data, false)}
                onSaveAndDuplicate={(data) => handleGuardarModificacion(data, true)}
                onCancel={() => setEditingAsignacion(null)}
                saving={savingEdit}
             />
          )}
        </DialogContent>
      </Dialog>

      {callingId && (
        <PanelLlamado
          idAsignacion={callingId}
          nombreInstitucion={confirmadas.find(a => a.id_asignacion === callingId)?.nombre_institucion}
          onClose={() => setCallingId(null)}
        />
      )}
    </div>
  );
}
