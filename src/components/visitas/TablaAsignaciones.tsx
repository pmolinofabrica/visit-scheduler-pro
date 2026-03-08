import { useAsignaciones, useActualizarEstado, useDisponibilidad } from '@/hooks/useVisitas';
import { ESTADO_LABELS, MES_NOMBRE } from '@/lib/types-visitas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';

interface Props {
  soloConfirmados?: boolean;
  estadosFiltrados?: string[];
}

export function TablaAsignaciones({ soloConfirmados, estadosFiltrados = [] }: Props) {
  const { data: asignaciones = [], isLoading } = useAsignaciones();
  const { data: slots = [] } = useDisponibilidad(2026);
  const actualizar = useActualizarEstado();
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const slotMap = useMemo(() => {
    const m: Record<number, any> = {};
    slots.forEach(s => { m[s.id_plani] = s; });
    return m;
  }, [slots]);

  const filtradas = useMemo(() => {
    let list = asignaciones;
    if (estadosFiltrados.length > 0 && !soloConfirmados) {
      list = list.filter(a => estadosFiltrados.includes(a.estado));
    }
    
    if (soloConfirmados) {
      list = list.filter(a => a.estado === 'confirmado' || a.estado === 'asignado');
    } else if (filtroEstado !== 'todos') {
      list = list.filter(a => a.estado === filtroEstado);
    }
    return list;
  }, [asignaciones, soloConfirmados, filtroEstado, estadosFiltrados]);

  const estadoColor: Record<string, string> = {
    asignado: 'bg-badge-assigned text-primary-foreground',
    confirmado: 'bg-badge-confirmed text-primary-foreground',
    en_espera: 'bg-badge-waiting text-primary-foreground',
    cancelado: 'bg-badge-cancelled text-primary-foreground',
    pendiente: 'bg-muted text-muted-foreground',
    duplicado: 'bg-muted text-muted-foreground',
    corregido: 'bg-muted text-muted-foreground',
  };

  const handleCambioEstado = async (id: number, estado: string) => {
    try {
      await actualizar.mutateAsync({ id, estado });
      toast.success(`Estado actualizado a ${ESTADO_LABELS[estado]}`);
    } catch {
      toast.error('Error al actualizar estado');
    }
  };

  if (isLoading) return <p className="text-muted-foreground p-4">Cargando...</p>;

  return (
    <div className="space-y-3">
      {!soloConfirmados && (
        <div className="flex gap-2">
          {['todos', 'pendiente', 'asignado', 'en_espera', 'confirmado', 'cancelado'].map(e => (
            <Button
              key={e}
              size="sm"
              variant={filtroEstado === e ? 'default' : 'outline'}
              onClick={() => setFiltroEstado(e)}
            >
              {e === 'todos' ? 'Todos' : ESTADO_LABELS[e]}
            </Button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-panel-header text-panel-header-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Institución</th>
              <th className="px-3 py-2 text-left">Referente</th>
              <th className="px-3 py-2 text-left">Fecha/Turno</th>
              <th className="px-3 py-2 text-center">Personas</th>
              <th className="px-3 py-2 text-center">Cupo</th>
              <th className="px-3 py-2 text-center">Estado</th>
              {!soloConfirmados && <th className="px-3 py-2 text-center">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtradas.map(a => {
              const slot = a.id_plani ? slotMap[a.id_plani] : null;
              return (
                <tr key={a.id_asignacion} className="hover:bg-muted/50">
                  <td className="px-3 py-2 font-medium">{a.nombre_institucion || '—'}</td>
                  <td className="px-3 py-2">
                    <div>{a.nombre_referente || '—'}</div>
                    <div className="text-xs text-muted-foreground">{a.email_referente}</div>
                  </td>
                  <td className="px-3 py-2">
                    {slot ? (
                      <>
                        <div>{new Date(slot.fecha + 'T12:00:00').toLocaleDateString('es-AR')}</div>
                        <div className="text-xs text-muted-foreground">{slot.tipo_turno}</div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Sin asignar</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">{a.cantidad_personas_original}</td>
                  <td className="px-3 py-2 text-center font-mono font-bold">{Math.round(a.cupo_calculado)}</td>
                  <td className="px-3 py-2 text-center">
                    <Badge className={cn('text-xs', estadoColor[a.estado])}>
                      {ESTADO_LABELS[a.estado]}
                    </Badge>
                  </td>
                  {!soloConfirmados && (
                    <td className="px-3 py-2 text-center">
                      <Select
                        value=""
                        onValueChange={v => handleCambioEstado(a.id_asignacion, v)}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue placeholder="Cambiar" />
                        </SelectTrigger>
                        <SelectContent>
                          {['asignado', 'en_espera', 'confirmado', 'cancelado', 'duplicado', 'corregido']
                            .filter(e => e !== a.estado)
                            .map(e => (
                              <SelectItem key={e} value={e}>{ESTADO_LABELS[e]}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </td>
                  )}
                </tr>
              );
            })}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  No hay asignaciones {soloConfirmados ? 'confirmadas' : ''}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
