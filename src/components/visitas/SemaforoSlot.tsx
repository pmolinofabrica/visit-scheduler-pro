import type { SlotDisponibilidad } from '@/lib/types-visitas';
import { DIA_SEMANA } from '@/lib/types-visitas';
import { cn } from '@/lib/utils';

interface Props {
  slot: SlotDisponibilidad;
  selected?: boolean;
  onClick?: () => void;
  destacado?: boolean;
}

const add15Mins = (timeStr?: string) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m + 15);
  return date.toTimeString().slice(0, 5);
};

const sub15Mins = (timeStr?: string) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m - 15);
  return date.toTimeString().slice(0, 5);
};

export function SemaforoSlot({ slot, selected, onClick, destacado }: Props) {
  const fecha = new Date(slot.fecha + 'T12:00:00');
  const dia = fecha.getDate();
  const diaSemana = DIA_SEMANA[slot.numero_dia_semana] || '';

  const semaforoStyles = {
    verde: 'bg-semaforo-verde-bg border-semaforo-verde text-semaforo-verde',
    amarillo: 'bg-semaforo-amarillo-bg border-semaforo-amarillo text-semaforo-amarillo',
    rojo: 'bg-semaforo-rojo-bg border-semaforo-rojo text-semaforo-rojo',
  };

  const dotStyles = {
    verde: 'bg-semaforo-verde',
    amarillo: 'bg-semaforo-amarillo',
    rojo: 'bg-semaforo-rojo',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left transition-all hover:shadow-md w-full',
        semaforoStyles[slot.semaforo],
        selected && 'ring-2 ring-ring ring-offset-2',
        destacado && 'shadow-lg scale-[1.02]',
      )}
    >
      {destacado && (
        <span className="absolute -top-2 -right-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
          Mes solicitado
        </span>
      )}
      <div className="flex w-full items-center justify-between">
        <span className="text-sm font-bold">
          {diaSemana} {dia}
        </span>
        <span className={cn('h-3 w-3 rounded-full', dotStyles[slot.semaforo])} />
      </div>
      <span className="text-xs font-medium opacity-80">
        {slot.tipo_turno === 'Turno mañana' ? '🌅 Mañana' : '🌆 Tarde'}
      </span>
      <span className="text-xs opacity-70">
        {add15Mins(slot.hora_inicio)} - {sub15Mins(slot.hora_fin)}
      </span>
      <div className="mt-1 flex w-full items-center gap-2 text-xs">
        <span className="font-semibold">{Math.round(slot.cupo_disponible)} disp.</span>
        {slot.cupo_en_espera > 0 && (
          <span className="rounded bg-espera-bg px-1 text-espera" title="Hay grupos en espera para revisar antes de decidir">
            {Math.round(slot.cupo_en_espera)} espera
          </span>
        )}
      </div>
    </button>
  );
}
