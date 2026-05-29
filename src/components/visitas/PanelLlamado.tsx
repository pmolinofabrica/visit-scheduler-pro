import { useState } from 'react';
import { useSeguimientoLlamados, useCrearSeguimientoLlamado, useEliminarSeguimientoLlamado } from '@/hooks/useVisitas';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Phone, PhoneOff, Clock, X, MessageSquare, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const AGENTES = ['eli', 'euge', 'celi', 'vane', 'pablo'];

interface Props {
  idAsignacion: number;
  nombreInstitucion?: string;
  onClose: () => void;
}

export function PanelLlamado({ idAsignacion, nombreInstitucion, onClose }: Props) {
  const { data: llamados = [], isLoading } = useSeguimientoLlamados(idAsignacion);
  const { mutateAsync: crearLlamado, isPending } = useCrearSeguimientoLlamado();
  const { mutateAsync: eliminarLlamado, isPending: isDeleting } = useEliminarSeguimientoLlamado();

  const [agente, setAgente] = useState('Pablo');
  const [observaciones, setObservaciones] = useState('');

  const handleLlamado = async (atendio: boolean) => {
    if (!agente) {
      toast.error('Seleccioná un agente');
      return;
    }
    try {
      await crearLlamado({
        id_asignacion: idAsignacion,
        agente,
        atendio,
        observaciones: observaciones || null,
        fecha_hora: new Date().toISOString(),
      });
      setObservaciones('');
      toast.success(atendio ? 'Llamado registrado — Atendió' : 'Llamado registrado — No atendió');
    } catch {
      toast.error('Error al registrar llamado');
    }
  };

  const handleEliminar = async (idLlamado: number) => {
    if (!confirm('¿Eliminar este registro de llamado?')) return;
    try {
      await eliminarLlamado(idLlamado);
      toast.success('Registro eliminado');
    } catch {
      toast.error('Error al eliminar registro');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-md bg-card border-l shadow-xl overflow-y-auto animate-in slide-in-from-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b px-4 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="font-bold text-sm truncate">{nombreInstitucion || 'Llamado'}</h3>
            <p className="text-xs text-muted-foreground">#{idAsignacion}</p>
          </div>
          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-5">
          {/* Selector de agente */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              ¿Quién llama?
            </label>
            <div className="flex flex-wrap gap-2">
              {AGENTES.map(a => (
                <button
                  key={a}
                  onClick={() => setAgente(a)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    agente === a
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-3 w-3" /> Observaciones
            </label>
            <Textarea
              placeholder="Notas sobre el llamado..."
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          {/* Botones de acción */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleLlamado(true)}
              disabled={isPending}
              className="bg-semaforo-verde hover:bg-semaforo-verde/90 text-white font-semibold h-10 gap-2"
            >
              <Phone className="h-4 w-4" />
              Llamado
            </Button>
            <Button
              onClick={() => handleLlamado(false)}
              disabled={isPending}
              variant="destructive"
              className="h-10 gap-2 font-semibold"
            >
              <PhoneOff className="h-4 w-4" />
              No atendió
            </Button>
          </div>

          {/* Historial de llamados */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Historial de llamados
            </h4>
            {isLoading ? (
              <p className="text-xs text-muted-foreground">Cargando...</p>
            ) : llamados.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Sin llamados registrados</p>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {[...llamados].reverse().map(ll => (
                  <div
                    key={ll.id_llamado}
                    className={cn(
                      'border rounded-lg px-3 py-2 text-xs space-y-1',
                      ll.atendio
                        ? 'bg-semaforo-verde/5 border-semaforo-verde/20'
                        : 'bg-semaforo-rojo/5 border-semaforo-rojo/20'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {ll.atendio ? (
                          <Phone className="h-3 w-3 text-semaforo-verde" />
                        ) : (
                          <PhoneOff className="h-3 w-3 text-semaforo-rojo" />
                        )}
                        <span className="font-medium">{ll.agente || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'font-semibold px-1.5 py-0.5 rounded-sm text-[10px]',
                          ll.atendio
                            ? 'text-semaforo-verde bg-semaforo-verde/10'
                            : 'text-semaforo-rojo bg-semaforo-rojo/10'
                        )}>
                          {ll.atendio ? 'Atendió' : 'No atendió'}
                        </span>
                        <span className="text-muted-foreground">
                          {ll.fecha_hora ? format(new Date(ll.fecha_hora), 'dd/MM HH:mm') : '—'}
                        </span>
                        <button
                          onClick={() => handleEliminar(ll.id_llamado)}
                          disabled={isDeleting}
                          className="text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded"
                          title="Eliminar registro"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    {ll.observaciones && (
                      <p className="text-muted-foreground italic pl-5">"{ll.observaciones}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
