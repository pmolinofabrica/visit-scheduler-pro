import { useMemo, useState } from 'react';
import { useAsignaciones, useDisponibilidad, useSeguimientoLlamados, useCrearSeguimientoLlamado } from '@/hooks/useVisitas';
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
function generarPlantillaAsignacion(a: AsignacionVisita, slot: any) {
  const fecha = slot ? new Date(slot.fecha + 'T12:00:00').toLocaleDateString('es-AR') : '[FECHA]';
  const turno = slot?.tipo_turno || '[TURNO]';
  return {
    asunto: `Visita confirmada - ${a.nombre_institucion || 'Institución'} - ${fecha}`,
    cuerpo: `Estimado/a ${a.nombre_referente || '[Referente]'},

Nos dirigimos a usted para confirmar la asignación de turno para la visita grupal de ${a.nombre_institucion || '[Institución]'}.

📅 Fecha: ${fecha}
🕐 Turno: ${turno}
👥 Cantidad de personas: ${a.cantidad_personas_original}

Le solicitamos que confirme la asistencia respondiendo a este correo.

Quedamos a disposición para cualquier consulta.

Saludos cordiales.`,
  };
}

function generarPlantillaConfirmacion(a: AsignacionVisita, slot: any) {
  const fecha = slot ? new Date(slot.fecha + 'T12:00:00').toLocaleDateString('es-AR') : '[FECHA]';
  const turno = slot?.tipo_turno || '[TURNO]';
  return {
    asunto: `Confirmación de visita - ${a.nombre_institucion || 'Institución'} - ${fecha}`,
    cuerpo: `Estimado/a ${a.nombre_referente || '[Referente]'},

Confirmamos su visita grupal a nuestras instalaciones con los siguientes datos:

📅 Fecha: ${fecha}
🕐 Turno: ${turno}
👥 Cantidad de personas: ${a.cantidad_personas_original}
🏫 Institución: ${a.nombre_institucion || ''}

Recomendaciones:
- Llegar con 15 minutos de antelación
- Traer listado de asistentes
- Coordinar con el referente ante cualquier cambio

Ante cualquier inconveniente, comunicarse con antelación.

Saludos cordiales.`,
  };
}

function LogRow({ asignacion, slot }: { asignacion: AsignacionVisita; slot: any }) {
  const { data: llamados = [] } = useSeguimientoLlamados(asignacion.id_asignacion);
  const { data: historial = [] } = useHistorial(asignacion.id_asignacion);
  const { data: correos = [] } = useCorreos(asignacion.id_asignacion);
  const crearLlamado = useCrearSeguimientoLlamado();
  const qc = useQueryClient();
  
  const [newObs, setNewObs] = useState('');
  const [newAtendio, setNewAtendio] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailType, setEmailType] = useState<'asignacion' | 'confirmacion'>('asignacion');
  const [emailAsunto, setEmailAsunto] = useState('');
  const [emailCuerpo, setEmailCuerpo] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const handleAddLlamado = async () => {
    try {
      await crearLlamado.mutateAsync({
        id_asignacion: asignacion.id_asignacion,
        atendio: newAtendio,
        observaciones: newObs || null,
        agente: null,
      });
      setNewObs('');
      setNewAtendio(false);
      toast.success('Llamado registrado');
    } catch {
      toast.error('Error al registrar llamado');
    }
  };

  const handlePrepareEmail = (tipo: 'asignacion' | 'confirmacion') => {
    setEmailType(tipo);
    const template = tipo === 'asignacion' 
      ? generarPlantillaAsignacion(asignacion, slot) 
      : generarPlantillaConfirmacion(asignacion, slot);
    setEmailAsunto(template.asunto);
    setEmailCuerpo(template.cuerpo);
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

      {/* Add call */}
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

      {/* Email actions */}
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
    </div>
  );
}

export function TablaSeguimiento({ estadosFiltrados = [] }: Props) {
  const { data: asignaciones = [], isLoading } = useAsignaciones();
  const { data: slots = [] } = useDisponibilidad(2026);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const slotMap = useMemo(() => {
    const m: Record<number, any> = {};
    slots.forEach(s => { m[s.id_plani] = s; });
    return m;
  }, [slots]);

  const filtradas = useMemo(() => {
    let list = asignaciones;
    if (estadosFiltrados.length > 0) {
      list = list.filter(a => estadosFiltrados.includes(a.estado));
    }
    if (filtroEstado !== 'todos') {
      list = list.filter(a => a.estado === filtroEstado);
    }
    return list;
  }, [asignaciones, filtroEstado, estadosFiltrados]);

  if (isLoading) return <p className="text-muted-foreground p-4">Cargando...</p>;

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {['todos', 'pendiente', 'asignado', 'en_espera', 'confirmado', 'cancelado', 'duplicado'].map(e => (
          <Button
            key={e}
            size="sm"
            variant={filtroEstado === e ? 'default' : 'outline'}
            onClick={() => setFiltroEstado(e)}
            className="text-xs"
          >
            {e === 'todos' ? 'Todos' : ESTADO_LABELS[e]}
          </Button>
        ))}
      </div>

      <div className="space-y-1">
        {filtradas.map(a => {
          const slot = a.id_plani ? slotMap[a.id_plani] : null;
          const isOpen = expandedId === a.id_asignacion;

          return (
            <Collapsible key={a.id_asignacion} open={isOpen} onOpenChange={open => setExpandedId(open ? a.id_asignacion : null)}>
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
                    <span className="text-xs text-muted-foreground hidden sm:inline">{a.nombre_referente}</span>
                  </div>
                  {slot && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(slot.fecha + 'T12:00:00').toLocaleDateString('es-AR')} · {slot.tipo_turno}
                    </span>
                  )}
                  <Badge className={cn('text-[10px] shrink-0', estadoColor[a.estado])}>
                    {ESTADO_LABELS[a.estado]}
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground">#{a.id_asignacion}</span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <LogRow asignacion={a} slot={slot} />
              </CollapsibleContent>
            </Collapsible>
          );
        })}
        {filtradas.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">No hay asignaciones para mostrar</p>
        )}
      </div>
    </div>
  );
}
