import { useState, useMemo } from 'react';
import { useAsignaciones, useDisponibilidad, useSolicitudesPendientes, useProcesarSolicitud } from '@/hooks/useVisitas';
import { ListaSolicitudes } from './ListaSolicitudes';
import { CalendarioAnual } from './CalendarioAnual';
import { ESTADO_LABELS, MES_NOMBRE, DIA_SEMANA, parseMesVisitaPreferido } from '@/lib/types-visitas';
import type { AsignacionEstado, AsignacionVisita } from '@/lib/types-visitas';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Users, Send, Pencil, Copy, Trash2, ArrowDownAZ } from 'lucide-react';
import { DetalleAsignacion } from './DetalleAsignacion';
import { FormModificacion } from './FormModificacion';
import type { SolicitudPendiente } from '@/lib/types-visitas';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface Props {
  estadosFiltrados?: string[];
}

type EstadoPanel = AsignacionEstado | 'modificar';

const ESTADO_PANEL_LABELS: Record<EstadoPanel, string> = {
  ...ESTADO_LABELS,
  modificar: 'Modificar datos',
};

export function PanelAsignar({ estadosFiltrados = [] }: Props) {
  const { data: asignaciones = [], isLoading: loadingAsig } = useAsignaciones();
  const { data: slots = [] } = useDisponibilidad(new Date().getFullYear());
  const { data: solicitudesPendientes = [], isLoading: loadingSol } = useSolicitudesPendientes();
  const qc = useQueryClient();
  const procesarSolicitud = useProcesarSolicitud();

  const [selectedSolicitudId, setSelectedSolicitudId] = useState<string | null>(null);
  const [selectedPlani, setSelectedPlani] = useState<number | null>(null);
  const [estado, setEstado] = useState<EstadoPanel>('asignado');
  const [agente, setAgente] = useState('Pablo');
  const [agenteOtro, setAgenteOtro] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewingAsignacionId, setViewingAsignacionId] = useState<number | null>(null);
  const [editingSolicitud, setEditingSolicitud] = useState<SolicitudPendiente | null>(null);
  const [editingAsignacionFromPanel, setEditingAsignacionFromPanel] = useState<AsignacionVisita | null>(null);
  const [duplicateMode, setDuplicateMode] = useState(false);
  
  const mapSolicitudToForm = (s: SolicitudPendiente): AsignacionVisita => ({
    id_asignacion: 0,
    id_visita: null,
    id_plani: null,
    estado: 'pendiente',
    cantidad_personas_original: s.cantidad_visitantes || 0,
    id_coeficiente: null,
    coeficiente_aplicado: s.coeficiente_calculado || 1,
    cupo_calculado: Math.ceil((s.cantidad_visitantes || 0) * (s.coeficiente_calculado || 1)),
    nombre_institucion: s.nombre_institucion || '',
    nombre_referente: s.nombre_referente || '',
    email_referente: s.email_referente || '',
    telefono_referente: s.telefono_referente || '',
    telefono_institucion: s.telefono_institucion || '',
    nombre_empresa: s.nombre_empresa_organizacion || '',
    rango_etario: s.rango_etario || '',
    mes_solicitado: parseMesVisitaPreferido(s.mes_visita_preferido),
    agente_asigno: null,
    observaciones: s.comentarios_observaciones || '',
    created_at: s.created_at || new Date().toISOString(),
    updated_at: s.marca_temporal || s.created_at || new Date().toISOString(),
  });

  const mapFormToSolicitudUpdate = (f: Partial<AsignacionVisita>) => {
    const reversedMes = f.mes_solicitado ? MES_NOMBRE[f.mes_solicitado as keyof typeof MES_NOMBRE] : null;
    return {
      nombre_institucion: f.nombre_institucion || null,
      nombre_empresa_organizacion: f.nombre_empresa || null,
      nombre_referente: f.nombre_referente || null,
      email_referente: f.email_referente || null,
      telefono_referente: f.telefono_referente || null,
      telefono_institucion: f.telefono_institucion || null,
      rango_etario: f.rango_etario || null,
      cantidad_visitantes: f.cantidad_personas_original || null,
      coeficiente_calculado: f.coeficiente_aplicado || null,
      comentarios_observaciones: f.observaciones || null,
      mes_visita_preferido: reversedMes,
      marca_temporal: new Date().toISOString(),
    };
  };

  const solicitudSeleccionada = useMemo(() => {
    return solicitudesPendientes.find(s => s.id === selectedSolicitudId) || null;
  }, [solicitudesPendientes, selectedSolicitudId]);

  const slotSeleccionado = useMemo(() => {
    return slots.find(s => s.id_plani === selectedPlani) || null;
  }, [slots, selectedPlani]);

  const asignacionViewing = useMemo(() => {
    return asignaciones.find(a => a.id_asignacion === viewingAsignacionId) || null;
  }, [asignaciones, viewingAsignacionId]);

  const handleSelectSolicitud = (id: string) => {
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
      const assignmentData: Partial<AsignacionVisita> = {
        estado: estado as AsignacionEstado,
        agente_asigno: (agente === 'Otro' ? agenteOtro : agente) || null,
        observaciones: observaciones || null,
        id_plani: selectedPlani || null,
        cantidad_personas_original: solicitudSeleccionada.cantidad_visitantes || 0,
        coeficiente_aplicado: solicitudSeleccionada.coeficiente_calculado || 1,
        cupo_calculado: Math.ceil((solicitudSeleccionada.cantidad_visitantes || 0) * (solicitudSeleccionada.coeficiente_calculado || 1)),
        nombre_institucion: solicitudSeleccionada.nombre_institucion || null,
        nombre_referente: solicitudSeleccionada.nombre_referente || null,
        email_referente: solicitudSeleccionada.email_referente || null,
        telefono_referente: solicitudSeleccionada.telefono_referente || null,
        telefono_institucion: solicitudSeleccionada.telefono_institucion || null,
        nombre_empresa: solicitudSeleccionada.nombre_empresa_organizacion || null,
        rango_etario: solicitudSeleccionada.rango_etario || null,
        mes_solicitado: parseMesVisitaPreferido(solicitudSeleccionada.mes_visita_preferido),
      };

      // estadoSolicitud: siempre 'Asignado' (con mayuscula) para que deje de matchear ilike('pendiente%')
      const estadoSolicitudNuevo = 'Asignado';

      await procesarSolicitud.mutateAsync({
        solicitudId: solicitudSeleccionada.id,
        assignment: assignmentData,
        estadoSolicitud: estadoSolicitudNuevo,
      });

      toast.success(`Solicitud actualizada a "${ESTADO_PANEL_LABELS[estado]}"`);
      // Forzar invalidación de todas las queries (garantiza refresco incluso si onSuccess llega tarde)
      await qc.invalidateQueries({ queryKey: ['solicitudes-pendientes'] });
      await qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
      await qc.invalidateQueries({ queryKey: ['disponibilidad-visitas'] });

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
      // Mapear los campos de AsignacionVisita de vuelta al schema de solicitudes
      const updateData = mapFormToSolicitudUpdate(formData);

      if (duplicar) {
        // Duplicar: insertar una nueva fila en solicitudes con los datos editados
        const { id, created_at, ...restSolicitud } = solicitudSeleccionada;
        const randomId = Math.floor(Math.random() * 1000);
        const nombreDuplicado = updateData.nombre_institucion ? `${updateData.nombre_institucion} (Copia #${randomId})` : `(Sin nombre - Copia #${randomId})`;
        const insertData = {
          ...restSolicitud,
          ...updateData,
          nombre_institucion: nombreDuplicado,
          estado_actual: 'pendiente',
          marca_temporal: new Date().toISOString(),
        };
        const { error: errorInsert } = await supabase
          .from('solicitudes' as any)
          .insert([insertData as any]);
        if (errorInsert) throw errorInsert;
        toast.success('Solicitud duplicada correctamente');
      } else {
        // Editar: actualizar la solicitud original
        const { error } = await supabase
          .from('solicitudes' as any)
          .update(updateData as any)
          .eq('id', solicitudSeleccionada.id);
        if (error) throw error;
        toast.success('Solicitud modificada correctamente');
      }

      qc.invalidateQueries({ queryKey: ['solicitudes-pendientes'] });
      setEstado('asignado');
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar modificación');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSolicitudForm = async (formData: Partial<AsignacionVisita>, duplicar: boolean) => {
    if (!editingSolicitud) return;
    setSaving(true);
    try {
      const updateData = mapFormToSolicitudUpdate(formData);
      
      // Determinar si debemos duplicar o solo actualizar
      // duplicar se recibe desde el botón presionado en FormModificacion.
      
      if (duplicar) {
        // En modo duplicar, insertamos un registro nuevo
        const { id, created_at, ...rest } = editingSolicitud;
        
        // Si el usuario guardó sin alterar el nombre para sortear la constraint,
        // o si eligió 'Guardar y duplicar' donde el form manda el mismo nombre
        const baseName = updateData.nombre_institucion || 'Sin institución';
        const randomId = Math.floor(Math.random() * 1000);
        const nombreDuplicado = duplicateMode ? updateData.nombre_institucion : `${baseName} (Copia #${randomId})`;
        
        const insertData = { 
          ...rest, 
          ...updateData,
          // Solo forzamos '(Duplicado)' en el clon si no estamos ya en mode Duplicate
          // Si estamos en modal de duplicar, FormModificacion ya lo agregó
          nombre_institucion: nombreDuplicado,
          estado_actual: 'pendiente',
          marca_temporal: new Date().toISOString()
        };
        const { error: errorInsert } = await supabase
          .from('solicitudes' as any)
          .insert([insertData as any]);
          
        if (errorInsert) throw errorInsert;
        toast.success(duplicateMode ? 'Guardado como nuevo duplicado' : 'Solicitud modificada y duplicada');
      } else {
        // Modo edición normal
        const { error } = await supabase
          .from('solicitudes' as any)
          .update(updateData as any)
          .eq('id', editingSolicitud.id);
          
        if (error) throw error;
        toast.success('Solicitud modificada correctamente');
      }
      
      qc.invalidateQueries({ queryKey: ['solicitudes-pendientes'] });
      setEditingSolicitud(null);
      setDuplicateMode(false);
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar solicitud');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSolicitud = async (id: string) => {
    if (!confirm('¿Seguro que querés eliminar esta solicitud?')) return;
    try {
      const { error } = await supabase.from('solicitudes' as any).delete().eq('id', id);
      if (error) throw error;
      toast.success('Solicitud eliminada');
      if (selectedSolicitudId === id) setSelectedSolicitudId(null);
      qc.invalidateQueries({ queryKey: ['solicitudes-pendientes'] });
    } catch (e: any) {
      toast.error('Error al eliminar');
    }
  };

  const handleDuplicateSolicitud = async (id: string) => {
    const s = solicitudesPendientes.find(s => s.id === id);
    if (!s) return;
    try {
      const { id: _, created_at, ...rest } = s;
      const insertData = { ...rest, marca_temporal: new Date().toISOString() };
      const { error } = await supabase.from('solicitudes' as any).insert([insertData as any]);
      if (error) throw error;
      toast.success('Solicitud duplicada (con valores originales)');
      qc.invalidateQueries({ queryKey: ['solicitudes-pendientes'] });
    } catch (e: any) {
      toast.error('Error al duplicar');
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
            {solicitudesPendientes.length} por revisar
          </p>
        </div>
        <ListaSolicitudes
          solicitudes={solicitudesPendientes}
          selectedId={selectedSolicitudId}
          onSelect={handleSelectSolicitud}
          onEdit={(id) => {
            setEditingSolicitud(solicitudesPendientes.find(s => s.id === id) || null);
            setDuplicateMode(false); // asegurarse que no queda en modo duplicar
          }}
          onDelete={handleDeleteSolicitud}
          onDuplicate={(id) => {
            // Duplicar desde la lista abre el formulario en modo duplicado (no insert directo)
            const s = solicitudesPendientes.find(s => s.id === id);
            if (!s) return;
            setEditingSolicitud(s);
            setDuplicateMode(true);
          }}
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
        <div className="sticky top-6 space-y-5 rounded-xl border bg-card shadow-elevated p-5">
          <h2 className="text-base font-bold flex items-center gap-2 pb-3 border-b tracking-tight">
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

              <div className="flex gap-2 pt-2 pb-1 border-b">
                <Button size="sm" variant="outline" className="h-8 text-xs flex-1" onClick={() => {
                  setEditingAsignacionFromPanel(asignacionViewing);
                  setDuplicateMode(false);
                  setViewingAsignacionId(null);
                }}>
                  <Pencil className="h-3 w-3 mr-1" /> Editar
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs flex-1" onClick={async () => {
                   setSaving(true);
                   try {
                     // 1. Enviar una copia limpia de vuelta a la tabla solicitudes
                     // Ignoramos id_asignacion, id_visita, etc
                     const { id_asignacion, created_at, updated_at, planificacion, id_plani, ...rest } = asignacionViewing;
                     const insertData = { 
                       ...rest, 
                       estado_actual: 'pendiente', 
                       marca_temporal: new Date().toISOString() 
                     };
                     
                     const { error: errInsert } = await supabase.from('solicitudes' as any).insert([insertData as any]);
                     if (errInsert) throw errInsert;
                     
                     // 2. Eliminar la asignación porque ya no es más una asignación confirmada o en_espera
                     const { error } = await supabase.from('asignaciones_visita' as any)
                       .delete()
                       .eq('id_asignacion', asignacionViewing.id_asignacion);
                       
                     if (error) throw error;
                     toast.success('Regresado a estado Pendiente satisfactoriamente');
                     
                     // Invalidar queries para que se actualice toda la app unificadamente
                     await qc.invalidateQueries({ queryKey: ['solicitudes-pendientes'] });
                     await qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
                     await qc.invalidateQueries({ queryKey: ['disponibilidad-visitas'] });
                     setViewingAsignacionId(null);
                   } catch (e: any) {
                     toast.error('Error al volver a pendiente');
                   } finally { setSaving(false); }
                }}>
                  <ArrowDownAZ className="h-3 w-3 mr-1" /> A Pendiente
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs flex-1" onClick={() => {
                  setEditingAsignacionFromPanel(asignacionViewing);
                  setDuplicateMode(true);
                  setViewingAsignacionId(null);
                }} title="Entrar a edición (puedes Guardar y Duplicar desde ahí)">
                  <Copy className="h-3 w-3 mr-1" /> Duplicar
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs flex-1 bg-destructive/5 hover:bg-destructive/10 text-destructive border-destructive/20" onClick={async () => {
                  if (!confirm('¿Estás seguro de que querés ELIMINAR definitivamente este turno?')) return;
                  setSaving(true);
                  try {
                    const { error } = await supabase.from('asignaciones_visita' as any).delete().eq('id_asignacion', asignacionViewing.id_asignacion);
                    if (error) throw error;
                    toast.success('Turno eliminado permanentemente');
                    // Invalidar asignaciones Y disponibilidad (el cupo debe actualizarse)
                    await qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
                    await qc.invalidateQueries({ queryKey: ['disponibilidad-visitas'] });
                    setViewingAsignacionId(null);
                  } catch (e: any) { toast.error('Error al eliminar'); }
                  finally { setSaving(false); }
                }}>
                  <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                </Button>
              </div>

             
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
                    asignacion={{
                      id_asignacion: 0,
                      id_visita: null,
                      id_plani: null,
                      estado: 'pendiente',
                      cantidad_personas_original: solicitudSeleccionada.cantidad_visitantes || 0,
                      id_coeficiente: null,
                      coeficiente_aplicado: solicitudSeleccionada.coeficiente_calculado || 1,
                      cupo_calculado: Math.ceil((solicitudSeleccionada.cantidad_visitantes || 0) * (solicitudSeleccionada.coeficiente_calculado || 1)),
                      nombre_institucion: solicitudSeleccionada.nombre_institucion,
                      nombre_referente: solicitudSeleccionada.nombre_referente,
                      email_referente: solicitudSeleccionada.email_referente,
                      telefono_referente: solicitudSeleccionada.telefono_referente,
                      telefono_institucion: solicitudSeleccionada.telefono_institucion,
                      nombre_empresa: solicitudSeleccionada.nombre_empresa_organizacion,
                      rango_etario: solicitudSeleccionada.rango_etario,
                      mes_solicitado: parseMesVisitaPreferido(solicitudSeleccionada.mes_visita_preferido),
                      agente_asigno: null,
                      observaciones: solicitudSeleccionada.comentarios_observaciones,
                      created_at: solicitudSeleccionada.created_at || '',
                      updated_at: solicitudSeleccionada.marca_temporal || solicitudSeleccionada.created_at || '',
                    } as AsignacionVisita} 
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
                          {slotSeleccionado.cupo_en_espera > 0 && (
                            <p className="text-xs text-espera font-medium">
                              Hay {Math.round(slotSeleccionado.cupo_en_espera)} cupos en espera para revisar antes de decidir.
                            </p>
                          )}
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
      <Dialog open={!!editingSolicitud || !!editingAsignacionFromPanel} onOpenChange={(open) => {
        if (!open) {
          setEditingSolicitud(null);
          setEditingAsignacionFromPanel(null);
          setDuplicateMode(false);
        }
      }}>
         <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          {editingSolicitud && (
             <FormModificacion
                asignacion={mapSolicitudToForm(editingSolicitud)}
                // Si la abrimos en modo "Duplicar" solo hay un botón y queremos que actúe como insert (duplicar=true)
                onSave={(data) => handleEditSolicitudForm(data, duplicateMode)}
                // Guardar + Duplicar siempre hace ambas (aunque acá solo insertará porque lo ajusté a comportamiento insert simple si 'duplicar')
                onSaveAndDuplicate={(data) => handleEditSolicitudForm(data, true)}
                onCancel={() => {
                  setEditingSolicitud(null);
                  setDuplicateMode(false);
                }}
                saving={saving}
                forceDuplicateMode={duplicateMode}
                slots={slots}
             />
          )}
          {editingAsignacionFromPanel && (
             <FormModificacion
                asignacion={editingAsignacionFromPanel}
                slots={slots}
                onSave={async (data) => {
                  // If in duplicateMode, force save as a new pending assignment
                  if (duplicateMode) {
                     const { id_asignacion, created_at, updated_at, ...rest } = editingAsignacionFromPanel as any;
                     const insertData = { ...rest, ...data, estado: 'pendiente', id_plani: null };
                     delete insertData.planificacion;
                     
                     setSaving(true);
                     try {
                       const { error } = await supabase.from('asignaciones_visita' as any).insert([insertData]);
                       if (error) throw error;
                       toast.success('Turno duplicado (enviado a pendientes)');
                       qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
                       setEditingAsignacionFromPanel(null);
                       setDuplicateMode(false);
                     } catch (e: any) { toast.error('Error al duplicar'); }
                     finally { setSaving(false); }
                     return;
                  }
                  
                  // Regular edit update
                  setSaving(true);
                  try {
                    const { error } = await supabase.from('asignaciones_visita' as any).update({ ...data, updated_at: new Date().toISOString() }).eq('id_asignacion', editingAsignacionFromPanel.id_asignacion);
                    if (error) throw error;
                    toast.success('Turno modificado correctamente');
                    qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
                    setEditingAsignacionFromPanel(null);
                  } catch (e: any) { toast.error('Error al editar'); }
                  finally { setSaving(false); }
                }}
                onSaveAndDuplicate={(data) => {
                  // Not strictly necessary since they clicked "Duplicate" button, but handled if they use regular Save & Duplicate
                  handleGuardarModificacion(data, true);
                  setEditingAsignacionFromPanel(null);
                }}
                onCancel={() => {
                  setEditingAsignacionFromPanel(null);
                  setDuplicateMode(false);
                }}
                saving={saving}
                forceDuplicateMode={duplicateMode}
             />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
