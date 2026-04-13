import { useMemo, useState } from 'react';
import { useAsignaciones, useDisponibilidad, useSeguimientoLlamados, useCrearSeguimientoLlamado, useSolicitudesPendientes, usePlantillasCorreo } from '@/hooks/useVisitas';
import { ESTADO_LABELS, MES_NOMBRE } from '@/lib/types-visitas';
import type { AsignacionVisita } from '@/lib/types-visitas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Phone, PhoneOff, Mail, MailCheck, FileText, History, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormModificacion } from './FormModificacion';
import { Pencil, Trash2, Copy } from 'lucide-react';
import { EditorPlantillasModal } from './EditorPlantillasModal';

interface Props {
  estadosFiltrados?: string[];
}

interface HistorialEntry {
  id_hist: number;
  id_asignacion: number;
  estado_anterior: string | null;
  estado_nuevo: string;
  usuario: string | null;
  motivo: string | null;
  created_at: string | null;
}

interface CorreoVisita {
  id_correo: number;
  id_asignacion: number;
  tipo_correo: string;
  destinatario_email: string;
  asunto: string | null;
  cuerpo: string | null;
  estado_envio: string;
  fecha_envio: string | null;
  respuesta_recibida: boolean;
  fecha_respuesta: string | null;
  notas: string | null;
  created_at: string | null;
}

const estadoColor: Record<string, string> = {
  asignado: 'bg-badge-assigned text-primary-foreground',
  confirmado: 'bg-badge-confirmed text-primary-foreground',
  en_espera: 'bg-badge-waiting text-primary-foreground',
  cancelado: 'bg-badge-cancelled text-primary-foreground',
  pendiente: 'bg-muted text-muted-foreground',
  duplicado: 'bg-muted text-muted-foreground',
  modificar: 'bg-accent text-accent-foreground',
};

function useHistorial(id_asignacion: number | null) {
  return useQuery({
    queryKey: ['historial-asignacion', id_asignacion],
    queryFn: async () => {
      if (!id_asignacion) return [];
      const { data, error } = await supabase
        .from('asignaciones_visita_historial' as any)
        .select('*')
        .eq('id_asignacion', id_asignacion)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as HistorialEntry[];
    },
    enabled: !!id_asignacion,
  });
}

function useCorreos(id_asignacion: number | null) {
  return useQuery({
    queryKey: ['correos-visita', id_asignacion],
    queryFn: async () => {
      if (!id_asignacion) return [];
      const { data, error } = await supabase
        .from('correos_visita' as any)
        .select('*')
        .eq('id_asignacion', id_asignacion)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as CorreoVisita[];
    },
    enabled: !!id_asignacion,
  });
}

// Email templates
function parseTemplate(template: { asunto: string; cuerpo: string } | undefined, a: AsignacionVisita, slot: any, tipo: 'asignacion' | 'confirmacion') {
  const fecha = slot ? new Date(slot.fecha + 'T12:00:00').toLocaleDateString('es-AR') : '[FECHA]';
  const turno = slot?.tipo_turno || '[TURNO]';
  const institucion = a.nombre_institucion || 'Institución';
  const referente = a.nombre_referente || 'Referente';
  const visitantes = a.cantidad_personas_original?.toString() || '0';
  const edades = a.rango_etario || '[EDADES]';
  
  const horario = turno.toLowerCase().includes('mañana') 
    ? '09:00 a 11:00 hs' 
    : turno.toLowerCase().includes('tarde') 
      ? '14:00 a 16:00 hs' 
      : '[HORARIO]';

  if (!template) {
    return {
      asunto: `${tipo === 'asignacion' ? 'Visita confirmada' : 'Confirmación de visita'} - ${institucion} - ${fecha}`,
      cuerpo: `Estimado/a ${referente},\n\nTenemos el agrado de indicarle que su solicitud está procesada.\n\n📅 Fecha asignada: ${fecha}\n🕐 Horario: ${horario}\n👥 Cantidad de personas: ${visitantes}\n👦 Edades: ${edades}\n🏫 Institución: ${institucion}\n\nPara confirmar la asistencia responda a este mail.\n\nSaludos cordiales.`
    };
  }

  const replaceVars = (str: string) => str
    .replace(/\{\{institucion\}\}/g, institucion)
    .replace(/\{\{referente\}\}/g, referente)
    .replace(/\{\{fecha\}\}/g, fecha)
    .replace(/\{\{turno\}\}/g, turno)
    .replace(/\{\{horario\}\}/g, horario)
    .replace(/\{\{visitantes\}\}/g, visitantes)
    .replace(/\{\{edades\}\}/g, edades);

  return {
    asunto: replaceVars(template.asunto),
    cuerpo: replaceVars(template.cuerpo),
  };
}

function LogRow({ asignacion, slot }: { asignacion: AsignacionVisita & { isSolicitudCruda?: boolean; originalSolicitud?: any }; slot: any }) {
  const isCruda = asignacion.isSolicitudCruda;
  const idAsigSafe = isCruda ? null : asignacion.id_asignacion;

  const { data: llamados = [] } = useSeguimientoLlamados(idAsigSafe);
  const { data: historial = [] } = useHistorial(idAsigSafe);
  const { data: correos = [] } = useCorreos(idAsigSafe);
  const { data: plantillas = [] } = usePlantillasCorreo();
  const crearLlamado = useCrearSeguimientoLlamado();
  const qc = useQueryClient();
  
  const [newObs, setNewObs] = useState('');
  const [newAtendio, setNewAtendio] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailType, setEmailType] = useState<'asignacion' | 'confirmacion'>('asignacion');
  const [emailAsunto, setEmailAsunto] = useState('');
  const [emailCuerpo, setEmailCuerpo] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const handleGuardarModificacion = async (formData: Partial<AsignacionVisita>, duplicar: boolean) => {
    setSavingEdit(true);
    try {
      const updateData = {
        ...formData,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('asignaciones_visita' as any)
        .update(updateData as any)
        .eq('id_asignacion', asignacion.id_asignacion);

      if (error) throw error;

      if (duplicar) {
        const baseName = formData.nombre_institucion || updateData.nombre_institucion || 'Sin institución';
        const randomId = Math.floor(Math.random() * 1000);
        
        const newSol = {
          marca_temporal: new Date().toISOString(),
          estado_actual: 'pendiente',
          nombre_institucion: `${baseName} (Copia #${randomId})`,
          nombre_referente: formData.nombre_referente ?? asignacion.nombre_referente,
          email_referente: formData.email_referente ?? asignacion.email_referente,
          telefono_referente: formData.telefono_referente ?? asignacion.telefono_referente,
          telefono_institucion: formData.telefono_institucion ?? asignacion.telefono_institucion,
          nombre_empresa_organizacion: formData.nombre_empresa ?? asignacion.nombre_empresa,
          rango_etario: formData.rango_etario ?? asignacion.rango_etario,
          cantidad_visitantes: formData.cantidad_personas_original ?? asignacion.cantidad_personas_original,
          comentarios_observaciones: formData.observaciones ?? asignacion.observaciones,
          coeficiente_calculado: formData.coeficiente_aplicado ?? asignacion.coeficiente_aplicado,
        };
        
        const { error: errorInsert } = await supabase
          .from('solicitudes' as any)
          .insert([newSol as any]);
        
        if (errorInsert) throw errorInsert;
        toast.success('Registro editado y duplicado (creado en estado Pendiente)');
        qc.invalidateQueries({ queryKey: ['solicitudes-pendientes'] });
      } else {
        toast.success('Solicitud modificada correctamente');
      }
      qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar modificación');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleEliminar = async () => {
    if (!confirm('¿Estás seguro de que querés ELIMINAR definitivamente este turno? Esta acción no se puede deshacer.')) return;
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from('asignaciones_visita' as any)
        .delete()
        .eq('id_asignacion', asignacion.id_asignacion);
      if (error) throw error;
      toast.success('Turno eliminado permanentemente');
      qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
    } catch (e: any) {
      toast.error(e.message || 'Error al eliminar');
      setSavingEdit(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const randomId = Math.floor(Math.random() * 1000);
      const newSol = {
        marca_temporal: new Date().toISOString(),
        estado_actual: 'pendiente',
        nombre_institucion: `${asignacion.nombre_institucion || 'Sin institución'} (Copia #${randomId})`,
        nombre_referente: asignacion.nombre_referente,
        email_referente: asignacion.email_referente,
        telefono_referente: asignacion.telefono_referente,
        telefono_institucion: asignacion.telefono_institucion,
        nombre_empresa_organizacion: asignacion.nombre_empresa,
        rango_etario: asignacion.rango_etario,
        cantidad_visitantes: asignacion.cantidad_personas_original,
        comentarios_observaciones: asignacion.observaciones,
        coeficiente_calculado: asignacion.coeficiente_aplicado,
      };
      
      const { error } = await supabase.from('solicitudes' as any).insert([newSol as any]);
      if (error) throw error;
      
      toast.success('Turno duplicado (enviado a lista de pendientes)');
      qc.invalidateQueries({ queryKey: ['solicitudes-pendientes'] });
      qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
    } catch (e: any) {
      toast.error(e.message || 'Error al duplicar');
    }
  };

  const handleAddLlamado = async () => {
    try {
      const payload: Partial<any> = {
        atendio: newAtendio,
        observaciones: newObs || null,
        agente: null,
      };

      if ((asignacion as any)._isSolicitudPendiente) {
        payload.id_solicitud = asignacion.id_asignacion; // id_asignacion contains the UUID for raw requests due to the mapped type interface.
      } else {
        payload.id_asignacion = asignacion.id_asignacion;
      }
      
      await crearLlamado.mutateAsync(payload as any);
      setNewObs('');
      setNewAtendio(false);
      toast.success('Llamado registrado');
    } catch {
      toast.error('Error al registrar llamado');
    }
  };

  const handlePrepareEmail = (tipo: 'asignacion' | 'confirmacion') => {
    setEmailType(tipo);
    const rawTemplate = plantillas.find(p => p.tipo_correo === tipo);
    const parsed = parseTemplate(rawTemplate, asignacion, slot, tipo);
    setEmailAsunto(parsed.asunto);
    setEmailCuerpo(parsed.cuerpo);
    setShowEmailForm(true);
  };

  const handleSaveEmail = async (estadoEnvio: 'enviado' | 'borrador') => {
    setSavingEmail(true);
    try {
      const { error } = await supabase
        .from('correos_visita' as any)
        .insert({
          id_asignacion: asignacion.id_asignacion,
          tipo_correo: emailType,
          destinatario_email: asignacion.email_referente || '',
          asunto: emailAsunto,
          cuerpo: emailCuerpo,
          estado_envio: estadoEnvio,
          fecha_envio: estadoEnvio === 'enviado' ? new Date().toISOString() : null,
        } as any);
      if (error) throw error;
      toast.success(estadoEnvio === 'enviado' ? 'Correo registrado como enviado' : 'Borrador guardado');
      setShowEmailForm(false);
      setEmailAsunto('');
      setEmailCuerpo('');
      qc.invalidateQueries({ queryKey: ['correos-visita', asignacion.id_asignacion] });
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar correo');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleMarcarEnviado = async (idCorreo: number) => {
    try {
      const { error } = await supabase
        .from('correos_visita' as any)
        .update({ estado_envio: 'enviado', fecha_envio: new Date().toISOString() } as any)
        .eq('id_correo', idCorreo);
      if (error) throw error;
      toast.success('Correo marcado como enviado');
      qc.invalidateQueries({ queryKey: ['correos-visita', asignacion.id_asignacion] });
    } catch (e: any) {
      toast.error(e.message || 'Error al actualizar correo');
    }
  };

  // Merge all events into a timeline
  const timeline = useMemo(() => {
    const events: { date: string; type: string; icon: React.ReactNode; text: string; detail?: string; correoId?: number }[] = [];
    
    llamados.forEach(l => {
      events.push({
        date: l.fecha_hora || l.created_at,
        type: 'llamado',
        icon: l.atendio ? <Phone className="h-3.5 w-3.5 text-semaforo-verde" /> : <PhoneOff className="h-3.5 w-3.5 text-destructive" />,
        text: l.atendio ? 'Llamado — Atendió' : 'Llamado — No atendió',
        detail: l.observaciones || undefined,
      });
    });
    
    historial.forEach(h => {
      events.push({
        date: h.created_at || '',
        type: 'estado',
        icon: <History className="h-3.5 w-3.5 text-primary" />,
        text: `${ESTADO_LABELS[h.estado_anterior || ''] || h.estado_anterior || '?'} → ${ESTADO_LABELS[h.estado_nuevo] || h.estado_nuevo}`,
        detail: [h.usuario, h.motivo].filter(Boolean).join(' · ') || undefined,
      });
    });

    correos.forEach(c => {
      const enviado = c.estado_envio === 'enviado';
      events.push({
        date: c.fecha_envio || c.created_at || '',
        type: 'correo',
        icon: enviado ? <MailCheck className="h-3.5 w-3.5 text-semaforo-verde" /> : <Mail className="h-3.5 w-3.5 text-muted-foreground" />,
        text: `Correo ${c.tipo_correo === 'asignacion' ? 'de asignación' : 'de confirmación'} — ${enviado ? 'Enviado' : 'Borrador'}`,
        detail: c.asunto || undefined,
        correoId: !enviado ? c.id_correo : undefined,
      });
    });

    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return events;
  }, [llamados, historial, correos]);

  return (
    <div className="space-y-4 p-4 bg-muted/30 border-t">
      {/* Timeline */}
      {timeline.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Historial de acciones</h4>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {timeline.map((ev, i) => (
              <div key={i} className="flex items-start gap-2 text-xs py-1.5 border-b border-border/30 last:border-0">
                <span className="mt-0.5 shrink-0">{ev.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{ev.text}</span>
                  {ev.detail && <p className="text-muted-foreground truncate">{ev.detail}</p>}
                </div>
                {ev.correoId && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] px-2 shrink-0"
                    onClick={() => handleMarcarEnviado(ev.correoId!)}
                  >
                    <Send className="h-3 w-3 mr-1" /> Enviado
                  </Button>
                )}
                <span className="text-muted-foreground shrink-0">
                  {ev.date ? format(new Date(ev.date), 'dd/MM HH:mm') : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">Sin acciones registradas</p>
      )}

      {/* Llamados - Siempre visible */}
      <div className="flex gap-2 items-end border-t pt-3">
        <div className="flex-1">
          <Input
            placeholder="Observación del llamado..."
            value={newObs}
            onChange={e => setNewObs(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <Button
          size="sm"
          variant={newAtendio ? 'default' : 'outline'}
          className="h-8 text-xs"
          onClick={() => setNewAtendio(!newAtendio)}
        >
          {newAtendio ? '✅ Atendió' : '❌ No atendió'}
        </Button>
        <Button size="sm" className="h-8 text-xs" onClick={handleAddLlamado} disabled={crearLlamado.isPending}>
          <Plus className="h-3 w-3 mr-1" /> Llamado
        </Button>
      </div>

      {/* Email actions - Solo para asignados/confirmados */}
      {!isCruda && (
        <div className="border-t pt-3 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" /> Correos
          </h4>
          {!showEmailForm ? (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handlePrepareEmail('asignacion')}>
                <Send className="h-3 w-3 mr-1" /> Correo Asignación
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handlePrepareEmail('confirmacion')}>
                <MailCheck className="h-3 w-3 mr-1" /> Correo Confirmación
              </Button>
            </div>
          ) : (
            <div className="space-y-2 bg-card border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {emailType === 'asignacion' ? '📨 Asignación' : '✅ Confirmación'}
                </Badge>
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setShowEmailForm(false)}>✕</Button>
              </div>
              <p className="text-xs text-muted-foreground">Para: {asignacion.email_referente || 'Sin email'}</p>
              <Input
                value={emailAsunto}
                onChange={e => setEmailAsunto(e.target.value)}
                className="h-8 text-xs"
                placeholder="Asunto..."
              />
              <Textarea
                value={emailCuerpo}
                onChange={e => setEmailCuerpo(e.target.value)}
                rows={6}
                className="text-xs resize-none"
              />
              <div className="flex gap-2">
                <Button size="sm" className="h-8 text-xs flex-1" onClick={() => handleSaveEmail('enviado')} disabled={savingEmail}>
                  <Send className="h-3 w-3 mr-1" /> Marcar como enviado
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleSaveEmail('borrador')} disabled={savingEmail}>
                  <FileText className="h-3 w-3 mr-1" /> Borrador
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Copiá el texto y envialo desde tu cliente de correo. Luego marcalo como enviado.</p>
            </div>
          )}
        </div>
      )}

      {/* Actions Admin */}
      <div className="border-t pt-3 mt-2 space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Administración</h4>
        {isEditing && !isCruda ? (
          <div className="pt-2">
            <FormModificacion
              asignacion={asignacion}
              onSave={(data) => handleGuardarModificacion(data, false)}
              onSaveAndDuplicate={(data) => handleGuardarModificacion(data, true)}
              onCancel={() => setIsEditing(false)}
              saving={savingEdit}
            />
          </div>
        ) : !isCruda ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setIsEditing(true)}>
              <Pencil className="h-3 w-3 mr-1" /> Editar
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleDuplicate}>
              <Copy className="h-3 w-3 mr-1" /> Duplicar
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs hover:bg-destructive/10 text-destructive border-destructive/30" onClick={handleEliminar} disabled={savingEdit}>
              <Trash2 className="h-3 w-3 mr-1" /> Eliminar
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic col-span-3">Administrá la solicitud (Editar, Duplicar, Eliminar) desde la sección de Asignación.</p>
        )}
      </div>
    </div>
  );
}

function TrackingCard({ a, slot, isOpen, onToggle }: { a: any; slot: any; isOpen: boolean; onToggle: () => void }) {
  const isCruda = a.isSolicitudCruda;
  const idAsigSafe = isCruda ? null : a.id_asignacion;
  const { data: correos = [] } = useCorreos(idAsigSafe);
  
  const enviosAsignacion = correos.filter(c => c.tipo_correo === 'asignacion' && c.estado_envio === 'enviado').length > 0;
  const enviosConfirmacion = correos.filter(c => c.tipo_correo === 'confirmacion' && c.estado_envio === 'enviado').length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg border transition-colors text-sm',
            isOpen ? 'bg-card shadow-sm border-primary/30' : 'bg-card/50 hover:bg-card border-border/50'
          )}
        >
          <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform text-muted-foreground', isOpen && 'rotate-180')} />
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <span className="font-semibold truncate">{a.nombre_institucion || 'Sin nombre'}</span>
            <span className="text-xs text-muted-foreground hidden lg:inline">{a.nombre_referente}</span>
          </div>
          
          {/* Badge Visuales de Emails */}
          <div className="flex gap-1 shrink-0 ml-auto mr-2">
            {enviosAsignacion && (
              <Badge variant="outline" className="bg-semaforo-verde/10 text-semaforo-verde border-semaforo-verde/30 flex items-center gap-1 text-[10px] px-1.5 font-bold">
                <MailCheck className="h-3 w-3" /> Asignación Env.
              </Badge>
            )}
            {enviosConfirmacion && (
              <Badge variant="outline" className="bg-semaforo-verde/10 text-semaforo-verde border-semaforo-verde/30 flex items-center gap-1 text-[10px] px-1.5 font-bold">
                <MailCheck className="h-3 w-3" /> Conf. Env.
              </Badge>
            )}
          </div>

          {slot && (
            <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline border-r pr-3 mr-1">
              {new Date(slot.fecha + 'T12:00:00').toLocaleDateString('es-AR')} · <span className="text-[10px] uppercase font-bold">{slot.tipo_turno}</span>
            </span>
          )}
          <Badge className={cn('text-[10px] shrink-0', estadoColor[a.estado])}>
            {ESTADO_LABELS[a.estado as keyof typeof ESTADO_LABELS]}
          </Badge>
          <span className="text-xs font-mono text-muted-foreground truncate max-w-[50px] shrink-0 text-right">
            #{typeof a.id_asignacion === 'string' ? 'F' : a.id_asignacion}
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <LogRow asignacion={a} slot={slot} />
      </CollapsibleContent>
    </Collapsible>
  );
}

export function TablaSeguimiento({ estadosFiltrados = [] }: Props) {
  const { data: asignaciones = [], isLoading: loadAsig } = useAsignaciones();
  const { data: solicitudesPendientes = [], isLoading: loadSol } = useSolicitudesPendientes();
  const { data: slots = [] } = useDisponibilidad(2026);
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  const slotMap = useMemo(() => {
    const m: Record<number, any> = {};
    slots.forEach(s => { m[s.id_plani] = s; });
    return m;
  }, [slots]);

  const filtradas = useMemo(() => {
    let list: any[] = [...asignaciones];
    
    // Add raw solicitudes inside the tracking if they meet pending
    const mappedSols = solicitudesPendientes.map(s => ({
       id_asignacion: `sol-${s.id}`,
       id_plani: null,
       estado: 'pendiente',
       nombre_institucion: s.nombre_institucion,
       nombre_referente: s.nombre_referente,
       email_referente: s.email_referente,
       telefono_referente: s.telefono_referente,
       cantidad_personas_original: s.cantidad_visitantes,
       isSolicitudCruda: true,
       originalSolicitud: s
    }));

    list = [...list, ...mappedSols];

    if (filtroEstado !== 'todos' && filtroEstado !== 'multiple') {
      list = list.filter(a => a.estado === filtroEstado);
    } else if (filtroEstado === 'multiple') {
      const counts = new Map<string, number>();
      list.forEach(a => {
        const nombre = (a.nombre_institucion || '').trim().toLowerCase();
        if (nombre) {
          const baseName = nombre.replace(/\s*\(copia #\d+\)$/i, '');
          counts.set(baseName, (counts.get(baseName) || 0) + 1);
        }
      });
      list = list.filter(a => {
        const nombre = (a.nombre_institucion || '').trim().toLowerCase();
        if (!nombre) return false;
        const baseName = nombre.replace(/\s*\(copia #\d+\)$/i, '');
        return (counts.get(baseName) || 0) > 1;
      });
    } else if (estadosFiltrados.length > 0) {
      list = list.filter(a => estadosFiltrados.includes(a.estado));
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(a => {
        const inst = (a.nombre_institucion || '').toLowerCase();
        const ref = (a.nombre_referente || '').toLowerCase();
        const slot = a.id_plani ? slotMap[a.id_plani] : null;
        const dateStr = slot ? new Date(slot.fecha + 'T12:00:00').toLocaleDateString('es-AR') : '';
        return inst.includes(q) || ref.includes(q) || dateStr.includes(q);
      });
    }

    return list;
  }, [asignaciones, solicitudesPendientes, filtroEstado, estadosFiltrados, searchTerm, slotMap]);

  if (loadAsig || loadSol) return <p className="text-muted-foreground p-4">Cargando...</p>;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {['todos', 'pendiente', 'asignado', 'en_espera', 'confirmado', 'cancelado', 'multiple'].map(e => (
            <Button
              key={e}
              size="sm"
              variant={filtroEstado === e ? 'default' : 'outline'}
              onClick={() => setFiltroEstado(e)}
              className="text-xs"
            >
              {e === 'todos' ? 'Todos' : e === 'multiple' ? 'Múltiples Visitas' : ESTADO_LABELS[e]}
            </Button>
          ))}
          <div className="ml-auto flex items-center">
             <EditorPlantillasModal />
          </div>
        </div>
        <div className="w-full sm:w-64">
           <Input
             placeholder="Buscar por institución, fecha..."
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
             className="h-8 text-xs bg-white"
           />
        </div>
      </div>

      <div className="space-y-1">
        {filtradas.map(a => {
          const slot = a.id_plani ? slotMap[a.id_plani] : null;
          const isOpen = expandedId === a.id_asignacion;

          return <TrackingCard key={a.id_asignacion} a={a} slot={slot} isOpen={isOpen} onToggle={() => setExpandedId(isOpen ? null : a.id_asignacion)} />;
        })}
        {filtradas.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">No hay asignaciones para mostrar</p>
        )}
      </div>
    </div>
  );
}
