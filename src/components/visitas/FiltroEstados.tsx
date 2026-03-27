import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ESTADO_LABELS } from '@/lib/types-visitas';

const ESTADOS_FILTRO = ['asignado', 'en_espera', 'confirmado', 'cancelado'] as const;

interface Props {
  value: string[];
  onChange: (value: string[]) => void;
}

export function FiltroEstados({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-xs font-semibold opacity-60 uppercase tracking-wider">Filtrar</span>
      <ToggleGroup type="multiple" value={value} onValueChange={onChange} className="gap-1">
        {ESTADOS_FILTRO.map(e => (
          <ToggleGroupItem
            key={e}
            value={e}
            size="sm"
            className="text-xs h-7 px-2.5 font-semibold rounded-lg border border-transparent data-[state=on]:text-pink-300 data-[state=on]:bg-transparent data-[state=on]:border-fuchsia-500 transition-all"
          >
            {ESTADO_LABELS[e]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
