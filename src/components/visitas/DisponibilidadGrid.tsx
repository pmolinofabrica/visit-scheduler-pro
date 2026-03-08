import { useMemo, useState } from 'react';
import type { SlotDisponibilidad } from '@/lib/types-visitas';
import { MES_NOMBRE } from '@/lib/types-visitas';
import { SemaforoSlot } from './SemaforoSlot';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  slots: SlotDisponibilidad[];
  mesSolicitado?: number;
  selectedSlot?: number | null;
  onSelectSlot: (id_plani: number) => void;
}

export function DisponibilidadGrid({ slots, mesSolicitado, selectedSlot, onSelectSlot }: Props) {
  const mesesDisponibles = useMemo(() => {
    const meses = [...new Set(slots.map(s => s.mes))].sort((a, b) => a - b);
    return meses;
  }, [slots]);

  const [mesActivo, setMesActivo] = useState<number>(mesSolicitado || mesesDisponibles[0] || 4);

  const slotsMes = useMemo(() => {
    return slots.filter(s => s.mes === mesActivo);
  }, [slots, mesActivo]);

  const idxActual = mesesDisponibles.indexOf(mesActivo);

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          disabled={idxActual <= 0}
          onClick={() => setMesActivo(mesesDisponibles[idxActual - 1])}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-2">
          {mesesDisponibles.map(m => (
            <Button
              key={m}
              variant={m === mesActivo ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMesActivo(m)}
              className={m === mesSolicitado ? 'ring-2 ring-primary ring-offset-1' : ''}
            >
              {MES_NOMBRE[m]}
              {m === mesSolicitado && ' ★'}
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={idxActual >= mesesDisponibles.length - 1}
          onClick={() => setMesActivo(mesesDisponibles[idxActual + 1])}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Slots grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {slotsMes.map(slot => (
          <SemaforoSlot
            key={slot.id_plani}
            slot={slot}
            selected={selectedSlot === slot.id_plani}
            onClick={() => onSelectSlot(slot.id_plani)}
            destacado={slot.mes === mesSolicitado}
          />
        ))}
        {slotsMes.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-8">
            No hay turnos disponibles para {MES_NOMBRE[mesActivo]}
          </p>
        )}
      </div>
    </div>
  );
}
