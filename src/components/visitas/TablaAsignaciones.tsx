import { useAsignaciones, useActualizarEstado, useDisponibilidad, useCrearAsignacion } from '@/hooks/useVisitas';
import { ESTADO_LABELS, MES_NOMBRE } from '@/lib/types-visitas';
import type { AsignacionVisita } from '@/lib/types-visitas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { Pencil, Trash2, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  soloConfirmados?: boolean;
  estadosFiltrados?: string[];
}

const estadoColor: Record<string, string> = {
  asignado:  'bg-badge-assigned text-primary-foreground',
  confirmado:'bg-badge-confirmed text-primary-foreground',
  en_espera: 'bg-badge-waiting text-primary-foreground',
  cancelado: 'bg-badge-cancelled text-primary-foreground',
  pendiente: 'bg-muted text-muted-foreground',
  duplicado: 'bg-muted text-muted-foreground',
  modificar: 'bg-accent text-accent-foreground',
};

// ─── Modal de Edición ────────────────────────────────────────────────────────
interface EditModalProps {
  asignacion: AsignacionVisita | null;
  onClose: () => void;
  onSaved: () => void;
}

function EditModal({ asignacion, onClose, onSaved }: EditModalProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<AsignacionVisita>>(asignacion || {});
  const [saving, setSaving] = useState(false);

  if (!asignacion) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('asignaciones_visita' as any)
        .update({
          nombre_institucion:        form.nombre_institucion,
          nombre_referente:          form.nombre_referente,
          email_referente:           form.email_referente,
          telefono_referente:        form.telefono_referente,
          telefono_institucion:      form.telefono_institucion,
          cantidad_personas_original:form.cantidad_personas_original,
          rango_etario:              form.rango_etario,
          observaciones:             form.observaciones,
        } as any)
        .eq('id_asignacion', asignacion.id_asignacion);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
      toast.success('Turno actualizado');
      onSaved();
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof AsignacionVisita, type: 'input' | 'textarea' = 'input') => (
    <div className="space-y-1">
      <Label className="text-xs font-medium">{label}</Label>
      {type === 'textarea' ? (
        <Textarea
          value={(form[key] as string) || ''}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          rows={2}
          className="text-sm resize-none"
        />
      ) : (
        <Input
          value={(form[key] as string | number) || ''}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="h-8 text-sm"
        />
      )}
    </div>
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar turno #{asignacion.id_asignacion}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {field('Institución', 'nombre_institucion')}
          {field('Referente', 'nombre_referente')}
          {field('Email referente', 'email_referente')}
          {field('Teléfono referente', 'telefono_referente')}
          {field('Teléfono institución', 'telefono_institucion')}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Cantidad de personas</Label>
            <Input
              type="number"
              value={form.cantidad_personas_original || ''}
              onChange={e => setForm(f => ({ ...f, cantidad_personas_original: Number(e.target.value) }))}
              className="h-8 text-sm"
            />
          </div>
          {field('Rango etario', 'rango_etario')}
          {field('Observaciones', 'observaciones', 'textarea')}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tabla Principal ─────────────────────────────────────────────────────────
export function TablaAsignaciones({ soloConfirmados, estadosFiltrados = [] }: Props) {
  const { data: asignaciones = [], isLoading } = useAsignaciones();
  const { data: slots = [] } = useDisponibilidad(2026);
  const actualizar = useActualizarEstado();
  const crearAsignacion = useCrearAsignacion();
  const qc = useQueryClient();

  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [editando, setEditando] = useState<AsignacionVisita | null>(null);
  const [eliminando, setEliminando] = useState<AsignacionVisita | null>(null);
  const [duplicando, setDuplicando] = useState<AsignacionVisita | null>(null);

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

  const handleCambioEstado = async (id: number, estado: string, currentIdPlani?: number | null) => {
    try {
      // Al volver a pendiente → limpiar slot asignado
      // Al volver a en_espera → preservar slot (no cambiar id_plani)
      const payload: { id: number; estado: string; id_plani?: number | null } = { id, estado };
      if (estado === 'pendiente') {
        payload.id_plani = null;
      }
      await actualizar.mutateAsync(payload);
      toast.success(`Estado actualizado a ${ESTADO_LABELS[estado] ?? estado}`);
    } catch {
      toast.error('Error al actualizar estado');
    }
  };

  const handleEliminar = async () => {
    if (!eliminando) return;
    try {
      const { error } = await supabase
        .from('asignaciones_visita' as any)
        .delete()
        .eq('id_asignacion', eliminando.id_asignacion);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['asignaciones-visita'] });
      qc.invalidateQueries({ queryKey: ['disponibilidad-visitas'] });
      toast.success('Turno eliminado');
    } catch (e: any) {
      toast.error(e.message || 'Error al eliminar');
    } finally {
      setEliminando(null);
    }
  };

  const handleDuplicar = async () => {
    if (!duplicando) return;
    try {
      // Crea una copia con estado "pendiente" y sin slot asignado
      const { id_asignacion, created_at, updated_at, id_plani, planificacion, ...rest } = duplicando as any;
      await crearAsignacion.mutateAsync({
        ...rest,
        id_plani: null,
        estado: 'pendiente',
        observaciones: `Duplicado de #${duplicando.id_asignacion}${rest.observaciones ? ' — ' + rest.observaciones : ''}`,
      });
      toast.success(`Duplicado creado — quedó en Pendiente sin turno asignado`);
    } catch (e: any) {
      toast.error(e.message || 'Error al duplicar');
    } finally {
      setDuplicando(null);
    }
  };

  if (isLoading) return <p className="text-muted-foreground p-4">Cargando...</p>;

  // Estados disponibles para cambiar, según contexto
  // "volver a espera" = en_espera, permite deshacer una asignación sin perder el slot
  const estadosCambiables = ['en_espera', 'pendiente', 'asignado', 'confirmado', 'cancelado', 'duplicado'];

  return (
    <div className="space-y-3">
      {!soloConfirmados && (
        <div className="flex gap-2 flex-wrap">
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
              {!soloConfirmados && <th className="px-3 py-2 text-center">Cambiar estado</th>}
              {!soloConfirmados && <th className="px-3 py-2 text-center">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtradas.map(a => {
              const slot = (a.id_plani !== null && a.id_plani !== undefined) ? slotMap[a.id_plani] : null;
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
                        onValueChange={v => handleCambioEstado(a.id_asignacion, v, a.id_plani)}
                      >
                        <SelectTrigger className="h-7 w-32 text-xs">
                          <SelectValue placeholder="Cambiar" />
                        </SelectTrigger>
                        <SelectContent>
                          {estadosCambiables
                            .filter(e => e !== a.estado)
                            .map(e => (
                              <SelectItem key={e} value={e}>
                                {ESTADO_LABELS[e]}
                                {e === 'en_espera' && a.estado !== 'en_espera' && (
                                  <span className="text-muted-foreground ml-1 text-[10px]">(preserva fecha)</span>
                                )}
                                {e === 'pendiente' && (
                                  <span className="text-muted-foreground ml-1 text-[10px]">(quita fecha)</span>
                                )}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </td>
                  )}
                  {!soloConfirmados && (
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Editar */}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title="Editar"
                          onClick={() => setEditando(a)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {/* Duplicar */}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-blue-500 hover:text-blue-600"
                          title="Duplicar (nuevo registro pendiente)"
                          onClick={() => setDuplicando(a)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        {/* Eliminar */}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          title="Eliminar"
                          onClick={() => setEliminando(a)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  No hay asignaciones {soloConfirmados ? 'confirmadas' : ''}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal editar */}
      <EditModal
        asignacion={editando}
        onClose={() => setEditando(null)}
        onSaved={() => setEditando(null)}
      />

      {/* Confirm duplicar */}
      <AlertDialog open={!!duplicando} onOpenChange={open => !open && setDuplicando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicar turno</AlertDialogTitle>
            <AlertDialogDescription>
              Se creará un nuevo registro <strong>pendiente sin fecha asignada</strong> con los mismos datos de{' '}
              <strong>{duplicando?.nombre_institucion}</strong>.<br /><br />
              Útil para dividir grupos o registrar una segunda institución sin volver a cargar el formulario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDuplicar}>Duplicar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm eliminar */}
      <AlertDialog open={!!eliminando} onOpenChange={open => !open && setEliminando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar turno</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que querés eliminar el turno de{' '}
              <strong>{eliminando?.nombre_institucion}</strong>?<br />
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleEliminar}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
