import { useState, useMemo } from 'react';
import { useCoeficientes, useCrearAsignacion } from '@/hooks/useVisitas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { SlotDisponibilidad } from '@/lib/types-visitas';
import { MES_NOMBRE, DIA_SEMANA } from '@/lib/types-visitas';

interface Props {
  selectedSlot: SlotDisponibilidad | null;
  onSuccess: () => void;
}

export function FormAsignacion({ selectedSlot, onSuccess }: Props) {
  const { data: coeficientes = [] } = useCoeficientes();
  const crear = useCrearAsignacion();

  const [form, setForm] = useState({
    nombre_institucion: '',
    nombre_referente: '',
    email_referente: '',
    telefono_referente: '',
    telefono_institucion: '',
    nombre_empresa: '',
    cantidad_personas: '',
    id_coeficiente: '',
    agente_asigno: '',
    observaciones: '',
    estado: 'asignado' as string,
  });

  const coefSeleccionado = useMemo(() => {
    return coeficientes.find(c => c.id_coeficiente === Number(form.id_coeficiente));
  }, [form.id_coeficiente, coeficientes]);

  const cupoCalculado = useMemo(() => {
    const cant = Number(form.cantidad_personas) || 0;
    const coef = coefSeleccionado?.valor || 1;
    return Math.ceil(cant * coef);
  }, [form.cantidad_personas, coefSeleccionado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error('Seleccioná un turno del semáforo');
      return;
    }
    if (!form.cantidad_personas || !form.nombre_institucion) {
      toast.error('Completá los campos obligatorios');
      return;
    }

    try {
      await crear.mutateAsync({
        id_plani: selectedSlot.id_plani,
        estado: form.estado as any,
        cantidad_personas_original: Number(form.cantidad_personas),
        id_coeficiente: form.id_coeficiente ? Number(form.id_coeficiente) : null,
        coeficiente_aplicado: coefSeleccionado?.valor || 1,
        cupo_calculado: cupoCalculado,
        nombre_institucion: form.nombre_institucion,
        nombre_referente: form.nombre_referente || null,
        email_referente: form.email_referente || null,
        telefono_referente: form.telefono_referente || null,
        telefono_institucion: form.telefono_institucion || null,
        nombre_empresa: form.nombre_empresa || null,
        rango_etario: coefSeleccionado?.rango_edad_texto || null,
        mes_solicitado: selectedSlot.mes,
        agente_asigno: form.agente_asigno || null,
        observaciones: form.observaciones || null,
      });
      toast.success('Turno asignado correctamente');
      setForm({
        nombre_institucion: '', nombre_referente: '', email_referente: '',
        telefono_referente: '', telefono_institucion: '', nombre_empresa: '',
        cantidad_personas: '', id_coeficiente: '', agente_asigno: '',
        observaciones: '', estado: 'asignado',
      });
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Error al asignar');
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Slot info */}
      {selectedSlot && (
        <div className="rounded-lg bg-muted p-3 text-sm">
          <p className="font-semibold">
            Turno seleccionado: {DIA_SEMANA[selectedSlot.numero_dia_semana]}{' '}
            {new Date(selectedSlot.fecha + 'T12:00:00').getDate()}/{MES_NOMBRE[selectedSlot.mes]} —{' '}
            {selectedSlot.tipo_turno} ({selectedSlot.hora_inicio?.slice(0, 5)} - {selectedSlot.hora_fin?.slice(0, 5)})
          </p>
          <p className="text-muted-foreground">
            Disponible: {Math.round(selectedSlot.cupo_disponible)} de {selectedSlot.cupo_total}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Institución *</Label>
          <Input value={form.nombre_institucion} onChange={set('nombre_institucion')} required />
        </div>
        <div>
          <Label>Referente</Label>
          <Input value={form.nombre_referente} onChange={set('nombre_referente')} />
        </div>
        <div>
          <Label>Email referente</Label>
          <Input type="email" value={form.email_referente} onChange={set('email_referente')} />
        </div>
        <div>
          <Label>Tel. referente</Label>
          <Input value={form.telefono_referente} onChange={set('telefono_referente')} />
        </div>
        <div>
          <Label>Tel. institución</Label>
          <Input value={form.telefono_institucion} onChange={set('telefono_institucion')} />
        </div>
        <div>
          <Label>Empresa (si aplica)</Label>
          <Input value={form.nombre_empresa} onChange={set('nombre_empresa')} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Cantidad personas *</Label>
          <Input type="number" min={1} value={form.cantidad_personas} onChange={set('cantidad_personas')} required />
        </div>
        <div>
          <Label>Rango etario</Label>
          <Select value={form.id_coeficiente} onValueChange={v => setForm(f => ({ ...f, id_coeficiente: v }))}>
            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
            <SelectContent>
              {coeficientes.map(c => (
                <SelectItem key={c.id_coeficiente} value={String(c.id_coeficiente)}>
                  {c.nombre_categoria} (×{c.valor})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Cupo calculado</Label>
          <div className="flex h-9 items-center rounded-md border bg-muted px-3 font-mono text-lg font-bold">
            {cupoCalculado || '—'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Estado</Label>
          <Select value={form.estado} onValueChange={v => setForm(f => ({ ...f, estado: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="asignado">✅ Asignado</SelectItem>
              <SelectItem value="en_espera">⏳ En espera</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Agente que asigna</Label>
          <Input value={form.agente_asigno} onChange={set('agente_asigno')} />
        </div>
      </div>

      <div>
        <Label>Observaciones</Label>
        <Textarea value={form.observaciones} onChange={set('observaciones')} rows={2} />
      </div>

      <Button type="submit" className="w-full" disabled={crear.isPending || !selectedSlot}>
        {crear.isPending ? 'Guardando...' : form.estado === 'en_espera' ? 'Poner en espera' : 'Asignar turno'}
      </Button>
    </form>
  );
}
