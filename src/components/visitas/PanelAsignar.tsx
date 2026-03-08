import { useState, useMemo } from 'react';
import { useAsignaciones, useDisponibilidad, useActualizarEstado } from '@/hooks/useVisitas';
import { ListaSolicitudes } from './ListaSolicitudes';
import { CalendarioAnual } from './CalendarioAnual';
import { ESTADO_LABELS, MES_NOMBRE, DIA_SEMANA } from '@/lib/types-visitas';
import type { SlotDisponibilidad } from '@/lib/types-visitas';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Users, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PanelAsignar() {
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

  const solicitudSeleccionada = useMemo(() => {
    return asignaciones.find(a => a.id_asignacion === selectedSolicitudId) || null;
  }, [asignaciones, selectedSolicitudId]);

  const slotSeleccionado = useMemo(() => {
    return slots.find(s => s.id_plani === selectedPlani) || null;
  }, [slots, selectedPlani]);

  const handleSelectSolicitud = (id: number) => {
    setSelectedSolicitudId(id);
    setSelectedPlani(null);
    setEstado('asignado');
  };

  const handleSubmit = async () => {
    if (!solicitudSeleccionada) {
      toast.error('Seleccioná una solicitud de la lista');
      return;
    }
    if (!selectedPlani && estado !== 'cancelado') {
      toast.error('Seleccioná un turno del calendario');
      return;
    }

    setSaving(true);
    try {
      const updateData: Record<string, any> = {
        estado,
        agente_asigno: agente || null,
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

      // Reset
      setSelectedSolicitudId(null);
      setSelectedPlani(null);
      setEstado('asignado');
      setAgente('');
      setObservaciones('');
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  if (loadingAsig) return <p className="text-muted-foreground p-4">Cargando solicitudes...</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Left: Solicitudes list */}
      <div className="lg:col-span-3 space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Solicitudes pendientes
        </h2>
        <p className="text-xs text-muted-foreground">
          {asignaciones.filter(a => a.estado === 'pendiente').length} solicitudes por asignar
        </p>
        <ListaSolicitudes
          solicitudes={asignaciones}
          selectedId={selectedSolicitudId}
          onSelect={handleSelectSolicitud}
        />
      </div>

      {/* Center: Calendar */}
      <div className="lg:col-span-6 space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Calendario de disponibilidad
        </h2>
        {/* Semáforo legend */}
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-semaforo-verde" /> Disponible
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-semaforo-amarillo" /> Ajustado
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-semaforo-rojo" /> Sin cupo
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-espera" /> En espera
          </span>
        </div>
        <div className="rounded-lg border p-4 max-h-[70vh] overflow-y-auto">
          <CalendarioAnual
            slots={slots}
            mesSolicitado={solicitudSeleccionada?.mes_solicitado || undefined}
            selectedSlot={selectedPlani}
            onSelectSlot={setSelectedPlani}
          />
        </div>
      </div>

      {/* Right: Action panel */}
      <div className="lg:col-span-3">
        <div className="sticky top-6 space-y-4 rounded-lg border p-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Send className="h-5 w-5" />
            Acción
          </h2>

          {/* Selected solicitud summary */}
          {solicitudSeleccionada ? (
            <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
              <p className="font-semibold">{solicitudSeleccionada.nombre_institucion}</p>
              <p className="text-xs text-muted-foreground">
                {solicitudSeleccionada.cantidad_personas_original} personas · Cupo: {Math.round(solicitudSeleccionada.cupo_calculado)}
              </p>
              <p className="text-xs text-muted-foreground">
                Mes solicitado: {MES_NOMBRE[solicitudSeleccionada.mes_solicitado || 0] || '—'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {solicitudSeleccionada.nombre_referente} — {solicitudSeleccionada.email_referente}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              ← Seleccioná una solicitud
            </p>
          )}

          {/* Selected slot summary */}
          {slotSeleccionado && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm space-y-1">
              <p className="font-semibold">
                {DIA_SEMANA[slotSeleccionado.numero_dia_semana]}{' '}
                {new Date(slotSeleccionado.fecha + 'T12:00:00').getDate()}/{MES_NOMBRE[slotSeleccionado.mes]}
              </p>
              <p className="text-xs">
                {slotSeleccionado.tipo_turno} ({slotSeleccionado.hora_inicio?.slice(0, 5)} - {slotSeleccionado.hora_fin?.slice(0, 5)})
              </p>
              <p className="text-xs text-muted-foreground">
                Disponible: {Math.round(slotSeleccionado.cupo_disponible)} de {slotSeleccionado.cupo_total}
              </p>
            </div>
          )}

          {/* Estado selector */}
          <div>
            <Label>Estado</Label>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="asignado">✅ Asignado</SelectItem>
                <SelectItem value="en_espera">⏳ En espera</SelectItem>
                <SelectItem value="confirmado">✔ Confirmado</SelectItem>
                <SelectItem value="cancelado">❌ Cancelado</SelectItem>
                <SelectItem value="duplicado">🔁 Duplicado</SelectItem>
                <SelectItem value="corregido">✏️ Corregido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Agente que asigna</Label>
            <Input value={agente} onChange={e => setAgente(e.target.value)} placeholder="Nombre del agente" />
          </div>

          <div>
            <Label>Observaciones</Label>
            <Textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={2} />
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={saving || !solicitudSeleccionada}
          >
            {saving ? 'Guardando...' : 'Actualizar solicitud'}
          </Button>
        </div>
      </div>
    </div>
  );
}
