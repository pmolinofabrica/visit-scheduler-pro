import { useState, useMemo } from 'react';
import { useAsignaciones, useDisponibilidad, useActualizarEstado } from '@/hooks/useVisitas';
import { ListaSolicitudes } from './ListaSolicitudes';
import { CalendarioAnual } from './CalendarioAnual';
import { ESTADO_LABELS, MES_NOMBRE, DIA_SEMANA } from '@/lib/types-visitas';
import type { AsignacionVisita } from '@/lib/types-visitas';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Users, Send } from 'lucide-react';
import { DetalleAsignacion } from './DetalleAsignacion';
import { FormModificacion } from './FormModificacion';

interface Props {
  estadosFiltrados?: string[];
}

export function PanelAsignar({ estadosFiltrados = [] }: Props) {
  const { data: asignaciones = [], isLoading: loadingAsig } = useAsignaciones();
  const { data: slots = [] } = useDisponibilidad(2026);
  const qc = useQueryClient();

  const [selectedSolicitudId, setSelectedSolicitudId] = useState<number | null>(null);
  const [selectedPlani, setSelectedPlani] = useState<number | null>(null);
  const [estado, setEstado] = useState<string>('asignado');
  const [agente, setAgente] = useState('Pablo');
  const [agenteOtro, setAgenteOtro] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewingAsignacionId, setViewingAsignacionId] = useState<number | null>(null);

  const solicitudSeleccionada = useMemo(() => {
    return asignaciones.find(a => a.id_asignacion === selectedSolicitudId) || null;
  }, [asignaciones, selectedSolicitudId]);

  const slotSeleccionado = useMemo(() => {
    return slots.find(s => s.id_plani === selectedPlani) || null;
  }, [slots, selectedPlani]);

  const asignacionViewing = useMemo(() => {
    return asignaciones.find(a => a.id_asignacion === viewingAsignacionId) || null;
  }, [asignaciones, viewingAsignacionId]);

  const handleSelectSolicitud = (id: number) => {
    setSelectedSolicitudId(id);
    setSelectedPlani(null);
    setEstado('asignado');
    setViewingAsignacionId(null);
  };

  const handleSelectAsignacionFromCalendar = (id: number) => {
    setViewingAsignacionId(id);
    setSelectedSolicitudId(null);
    const viewed = asignaciones.find(a => a.id_asignacion === id);
    if (viewed) setEstado(viewed.estado);
  };

  const handleSubmit = async () => {
    if (!solicitudSeleccionada) {
      toast.error('Seleccioná una solicitud de la lista');
      return;
    }
    if (!selectedPlani && estado !== 'cancelado' && estado !== 'duplicado') {
      toast.error('Seleccioná un turno del calendario');
      return;
    }

    setSaving(true);
    try {
      const updateData: Record<string, any> = {
        estado,
        agente_asigno: (agente === 'Otro' ? agenteOtro : agente) || null,
        observaciones: observaciones || null,
        updated_at: new Date().toISOString(),
      };
      if (selectedPlani) {
        updateData.id_plani = selectedPlani;
      }

      const { error } = await supabase
        .from('asignaciones_visita' as any)
        .update(updateData as any)
        .eq('id_asignacion', solicitudSeleccionada.id_asignacion);

      if (error) throw error;

      toast.success(`Solicitud actualizada a "${ESTADO_LABELS[estado]}"`);
      qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
      qc.invalidateQueries({ queryKey: ['disponibilidad-visitas'] });

      setSelectedSolicitudId(null);
      setSelectedPlani(null);
      setEstado('asignado');
      setAgente('Pablo');
      setAgenteOtro('');
      setObservaciones('');
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleGuardarModificacion = async (formData: Partial<AsignacionVisita>, duplicar: boolean) => {
    if (!solicitudSeleccionada) return;
    setSaving(true);
    try {
      const updateData = {
        ...formData,
        estado: 'pendiente', // Modificado keeps it pending or whatever is requested, let's say "pendiente" so it can be assigned
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('asignaciones_visita' as any)
        .update(updateData as any)
        .eq('id_asignacion', solicitudSeleccionada.id_asignacion);

      if (error) throw error;

      if (duplicar) {
        // Remove id so DB generates a new one
        const { id_asignacion, created_at, updated_at, ...rest } = solicitudSeleccionada;
        const insertData = {
          ...rest,
          ...formData,
          estado: 'pendiente',
          id_plani: null,
          agente_asigno: (agente === 'Otro' ? agenteOtro : agente) || null,
        };
        delete (insertData as any).planificacion;
        const { data: newRow, error: errorInsert } = await supabase
          .from('asignaciones_visita' as any)
          .insert([insertData as any])
          .select()
          .single();
        
        if (errorInsert) throw errorInsert;
        
        await qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
        
        // Load the new duplicated record for immediate editing
        if (newRow) {
          setSelectedSolicitudId((newRow as any).id_asignacion);
          setEstado('modificar');
          toast.success('Solicitud duplicada — editá los datos del nuevo turno');
        } else {
          toast.success('Solicitud modificada y duplicada correctamente');
          setEstado('asignado');
        }
      } else {
        toast.success('Solicitud modificada correctamente');
        qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
        setEstado('asignado');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar modificación');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (inicio?: string, fin?: string) => {
    if (!inicio || !fin) return '';
    const [hi, mi] = inicio.split(':').map(Number);
    const [hf, mf] = fin.split(':').map(Number);
    const dInicio = new Date(); dInicio.setHours(hi, mi + 15);
    const dFin = new Date(); dFin.setHours(hf, mf - 15);
    return `${dInicio.toTimeString().slice(0, 5)} - ${dFin.toTimeString().slice(0, 5)}`;
  };

  if (loadingAsig) return <p className="text-muted-foreground p-4">Cargando solicitudes...</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Left: Solicitudes list */}
      <div className="lg:col-span-3 space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold flex items-center gap-2 tracking-tight">
            <Users className="h-5 w-5 text-primary" />
            Solicitudes pendientes
          </h2>
          <p className="text-xs text-muted-foreground font-medium">
            {asignaciones.filter(a => a.estado === 'pendiente').length} por asignar
          </p>
        </div>
        <ListaSolicitudes
          solicitudes={asignaciones}
          selectedId={selectedSolicitudId}
          onSelect={handleSelectSolicitud}
        />
      </div>

      {/* Center: Calendar */}
      <div className="lg:col-span-5 space-y-4">
        <h2 className="text-base font-bold flex items-center gap-2 tracking-tight">
          <CalendarDays className="h-5 w-5 text-primary" />
          Disponibilidad
        </h2>
        <div className="flex flex-wrap gap-3 text-xs bg-card p-2.5 rounded-lg border shadow-soft">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-semaforo-verde" /> Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-semaforo-amarillo" /> Ajustado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-semaforo-rojo" /> Sin cupo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-espera" /> En espera
          </span>
        </div>
        <div className="rounded-xl border bg-card shadow-soft p-4 max-h-[75vh] overflow-y-auto">
          <CalendarioAnual
            slots={slots}
            asignaciones={estadosFiltrados.length > 0 ? asignaciones.filter(a => a.estado === 'pendiente' || estadosFiltrados.includes(a.estado)) : asignaciones}
            mesSolicitado={solicitudSeleccionada?.mes_solicitado || undefined}
            selectedSlot={selectedPlani}
            cupoRequerido={solicitudSeleccionada?.cupo_calculado || 0}
            onSelectSlot={setSelectedPlani}
            onSelectAsignacion={handleSelectAsignacionFromCalendar}
          />
        </div>
      </div>

      {/* Right: Action panel */}
      <div className="lg:col-span-4">
        <div className="sticky top-6 space-y-5 rounded-xl border bg-card shadow-sm p-5">
          <h2 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b">
            <Send className="h-5 w-5 text-primary" />
            {viewingAsignacionId ? 'Detalle de Asignación' : 'Panel de Acción'}
          </h2>

          {/* Viewing an existing assignment from calendar */}
          {asignacionViewing ? (
            <div className="space-y-4">
              <DetalleAsignacion
                asignacion={asignacionViewing}
                slot={asignacionViewing.id_plani ? slots.find(s => s.id_plani === asignacionViewing.id_plani) : undefined}
                onClose={() => { setViewingAsignacionId(null); setEstado('asignado'); }}
              />
              
              {/* Form to update the state of the viewed assignment */}
              <div className="pt-4 border-t space-y-4 animate-in fade-in slide-in-from-top-2">
                <h3 className="font-semibold text-sm">Actualizar estado</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Nuevo estado</Label>
                    <Select value={estado} onValueChange={setEstado}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asignado">✅ Asignado</SelectItem>
                        <SelectItem value="en_espera">⏳ En espera</SelectItem>
                        <SelectItem value="confirmado">✔ Confirmado</SelectItem>
                        <SelectItem value="cancelado">❌ Cancelado</SelectItem>
                        <SelectItem value="duplicado">🔁 Duplicado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Agente responsable</Label>
                    <Select value={agente} onValueChange={setAgente}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pablo">Pablo</SelectItem>
                        <SelectItem value="Vanesa">Vanesa</SelectItem>
                        <SelectItem value="Celina">Celina</SelectItem>
                        <SelectItem value="Eugenia">Eugenia</SelectItem>
                        <SelectItem value="Eliana">Eliana</SelectItem>
                        <SelectItem value="Otro">Otro...</SelectItem>
                      </SelectContent>
                    </Select>
                    {agente === 'Otro' && (
                      <Input
                        className="mt-2 h-8 text-sm"
                        value={agenteOtro}
                        onChange={e => setAgenteOtro(e.target.value)}
                        placeholder="Nombre..."
                      />
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Observaciones de actualización</Label>
                  <Textarea 
                    value={observaciones} 
                    onChange={e => setObservaciones(e.target.value)} 
                    rows={2}
                    className="resize-none"
                    placeholder="Notas internas sobre este cambio..."
                  />
                </div>
                <Button
                  className="w-full font-semibold shadow-sm"
                  size="lg"
                  onClick={async () => {
                    setSaving(true);
                    try {
                      const updateData: Record<string, any> = {
                        estado,
                        agente_asigno: (agente === 'Otro' ? agenteOtro : agente) || null,
                        updated_at: new Date().toISOString(),
                      };
                      if (observaciones) {
                        updateData.observaciones = observaciones;
                      }

                      const { error } = await supabase
                        .from('asignaciones_visita' as any)
                        .update(updateData)
                        .eq('id_asignacion', asignacionViewing.id_asignacion);

                      if (error) throw error;

                      toast.success(`Estado actualizado a "${ESTADO_LABELS[estado]}"`);
                      qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
                      qc.invalidateQueries({ queryKey: ['disponibilidad-visitas'] });
                      
                      setViewingAsignacionId(null);
                      setEstado('asignado');
                      setAgente('Pablo');
                      setAgenteOtro('');
                      setObservaciones('');
                    } catch (err: any) {
                      toast.error(err.message || 'Error al actualizar');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving || estado === asignacionViewing.estado}
                >
                  {saving ? 'Guardando...' : `Actualizar Estado a ${ESTADO_LABELS[estado]}`}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Selected solicitud summary */}
              {solicitudSeleccionada ? (
                <div className="space-y-4">
                  <DetalleAsignacion 
                    asignacion={solicitudSeleccionada} 
                    hideClose={true} 
                    onClose={() => {}} 
                  />
                  
                  {estado === 'modificar' ? (
                    <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                      <FormModificacion 
                        asignacion={solicitudSeleccionada}
                        onSave={(data) => handleGuardarModificacion(data, false)}
                        onSaveAndDuplicate={(data) => handleGuardarModificacion(data, true)}
                        onCancel={() => setEstado('asignado')}
                        saving={saving}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4 pt-4 border-t">
                      {/* Selected slot summary */}
                      {slotSeleccionado ? (
                        <div className="rounded-lg bg-primary/10 border border-primary/30 p-3 text-sm space-y-1 shadow-sm">
                          <p className="font-bold text-primary">
                            Turno seleccionado: {DIA_SEMANA[slotSeleccionado.numero_dia_semana]}{' '}
                            {new Date(slotSeleccionado.fecha + 'T12:00:00').getDate()}/{MES_NOMBRE[slotSeleccionado.mes]}
                          </p>
                          <p className="text-xs font-medium">
                            {slotSeleccionado.tipo_turno} ({formatTime(slotSeleccionado.hora_inicio, slotSeleccionado.hora_fin)})
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 bg-background inline-block px-1.5 py-0.5 rounded border">
                            Cupo Disponible: {Math.round(slotSeleccionado.cupo_disponible)} de {slotSeleccionado.cupo_total}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground p-3 border border-dashed rounded-lg text-center bg-muted/30">
                          Seleccioná un turno en el calendario
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Estado a aplicar</Label>
                          <Select value={estado} onValueChange={setEstado}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="asignado">✅ Asignado</SelectItem>
                              <SelectItem value="en_espera">⏳ En espera</SelectItem>
                              <SelectItem value="confirmado">✔ Confirmado</SelectItem>
                              <SelectItem value="cancelado">❌ Cancelado</SelectItem>
                              <SelectItem value="duplicado">🔁 Duplicado</SelectItem>
                              <SelectItem value="modificar">✏️ Modificar datos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label>Agente responsable</Label>
                          <Select value={agente} onValueChange={setAgente}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pablo">Pablo</SelectItem>
                              <SelectItem value="Vanesa">Vanesa</SelectItem>
                              <SelectItem value="Celina">Celina</SelectItem>
                              <SelectItem value="Eugenia">Eugenia</SelectItem>
                              <SelectItem value="Eliana">Eliana</SelectItem>
                              <SelectItem value="Otro">Otro...</SelectItem>
                            </SelectContent>
                          </Select>
                          {agente === 'Otro' && (
                            <Input
                              className="mt-2 h-8 text-sm"
                              value={agenteOtro}
                              onChange={e => setAgenteOtro(e.target.value)}
                              placeholder="Nombre..."
                            />
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Observaciones de asignación</Label>
                        <Textarea 
                          value={observaciones} 
                          onChange={e => setObservaciones(e.target.value)} 
                          rows={2}
                          className="resize-none"
                          placeholder="Notas internas sobre este turno..."
                        />
                      </div>

                      <Button
                        className="w-full font-semibold shadow-sm"
                        size="lg"
                        onClick={handleSubmit}
                        disabled={saving || (!selectedPlani && estado !== 'cancelado' && estado !== 'duplicado')}
                      >
                        {saving ? 'Guardando...' : `Aplicar Estado: ${ESTADO_LABELS[estado]}`}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-50">
                  <Users className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Seleccioná una solicitud de la lista<br/>para comenzar el flujo de asignación
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
