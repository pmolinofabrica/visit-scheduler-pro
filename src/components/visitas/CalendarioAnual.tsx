import { useMemo, useState } from 'react';
import type { SlotDisponibilidad } from '@/lib/types-visitas';
import { MES_NOMBRE, DIA_SEMANA } from '@/lib/types-visitas';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  slots: SlotDisponibilidad[];
  mesSolicitado?: number;
  selectedSlot?: number | null;
  onSelectSlot: (id_plani: number) => void;
}

export function CalendarioAnual({ slots, mesSolicitado, selectedSlot, onSelectSlot }: Props) {
  const mesesDisponibles = useMemo(() => {
    return [...new Set(slots.map(s => s.mes))].sort((a, b) => a - b);
  }, [slots]);

  const [mesActivo, setMesActivo] = useState<number>(mesSolicitado || mesesDisponibles[0] || 4);

  // Group slots by date for the active month
  const fechasConSlots = useMemo(() => {
    const filtered = slots.filter(s => s.mes === mesActivo);
    const grouped: Record<string, SlotDisponibilidad[]> = {};
    filtered.forEach(s => {
      if (!grouped[s.fecha]) grouped[s.fecha] = [];
      grouped[s.fecha].push(s);
    });
    // Sort by date
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [slots, mesActivo]);

  const idxActual = mesesDisponibles.indexOf(mesActivo);

  const getSemaforoColor = (semaforo: string) => {
    switch (semaforo) {
      case 'verde': return 'bg-semaforo-verde';
      case 'amarillo': return 'bg-semaforo-amarillo';
      case 'rojo': return 'bg-semaforo-rojo';
      default: return 'bg-muted';
    }
  };

  const getSemaforoBg = (semaforo: string) => {
    switch (semaforo) {
      case 'verde': return 'bg-semaforo-verde-bg border-semaforo-verde hover:shadow-md';
      case 'amarillo': return 'bg-semaforo-amarillo-bg border-semaforo-amarillo hover:shadow-md';
      case 'rojo': return 'bg-semaforo-rojo-bg border-semaforo-rojo hover:shadow-md';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-4">
      {/* Month tabs */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost" size="sm"
          disabled={idxActual <= 0}
          onClick={() => setMesActivo(mesesDisponibles[idxActual - 1])}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-1.5 flex-wrap justify-center">
          {mesesDisponibles.map(m => (
            <Button
              key={m}
              variant={m === mesActivo ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMesActivo(m)}
              className={cn(
                'text-xs',
                m === mesSolicitado && m !== mesActivo && 'ring-2 ring-primary ring-offset-1'
              )}
            >
              {MES_NOMBRE[m]}
              {m === mesSolicitado && ' ★'}
            </Button>
          ))}
        </div>
        <Button
          variant="ghost" size="sm"
          disabled={idxActual >= mesesDisponibles.length - 1}
          onClick={() => setMesActivo(mesesDisponibles[idxActual + 1])}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Dates grid */}
      <div className="space-y-3">
        {fechasConSlots.map(([fecha, slotsDelDia]) => {
          const d = new Date(fecha + 'T12:00:00');
          const diaSemana = DIA_SEMANA[d.getDay()] || '';
          const diaNum = d.getDate();

          return (
            <div key={fecha} className="flex items-stretch gap-3">
              {/* Date label */}
              <div className={cn(
                'flex flex-col items-center justify-center rounded-lg border px-3 py-2 min-w-[80px]',
                slotsDelDia.some(s => s.mes === mesSolicitado) && 'border-primary bg-primary/5'
              )}>
                <span className="text-xs text-muted-foreground">{diaSemana}</span>
                <span className="text-lg font-bold">{diaNum}</span>
                <span className="text-xs text-muted-foreground">{MES_NOMBRE[mesActivo]}</span>
              </div>

              {/* Turno buttons */}
              <div className="flex gap-2 flex-1">
                {slotsDelDia
                  .sort((a, b) => (a.tipo_turno || '').localeCompare(b.tipo_turno || ''))
                  .map(slot => (
                    <button
                      key={slot.id_plani}
                      onClick={() => onSelectSlot(slot.id_plani)}
                      className={cn(
                        'flex-1 rounded-lg border-2 p-3 text-left transition-all',
                        getSemaforoBg(slot.semaforo),
                        selectedSlot === slot.id_plani && 'ring-2 ring-ring ring-offset-2 scale-[1.02]'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">
                          {slot.tipo_turno === 'Turno mañana' ? '🌅 Mañana' : '🌆 Tarde'}
                        </span>
                        <span className={cn('h-3 w-3 rounded-full', getSemaforoColor(slot.semaforo))} />
                      </div>
                      <div className="text-xs mt-1 opacity-80">
                        {slot.hora_inicio?.slice(0, 5)} - {slot.hora_fin?.slice(0, 5)}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-xs">
                        <span className="font-bold">{Math.round(slot.cupo_disponible)} disp.</span>
                        {slot.cupo_en_espera > 0 && (
                          <span className="rounded bg-espera-bg px-1 text-espera">
                            {Math.round(slot.cupo_en_espera)} espera
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          );
        })}
        {fechasConSlots.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay turnos disponibles para {MES_NOMBRE[mesActivo]}
          </p>
        )}
      </div>
    </div>
  );
}
