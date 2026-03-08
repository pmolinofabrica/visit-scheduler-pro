import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ESTADO_LABELS } from '@/lib/types-visitas';

const ESTADOS_FILTRO = ['asignado', 'en_espera', 'confirmado', 'cancelado'] as const;

interface Props {
  value: string[];
  onChange: (value: string[]) => void;
}

export function FiltroEstados({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium text-muted-foreground">Filtrar:</span>
      <ToggleGroup type="multiple" value={value} onValueChange={onChange} className="gap-1">
        {ESTADOS_FILTRO.map(e => (
          <ToggleGroupItem
            key={e}
            value={e}
            size="sm"
            className="text-xs h-7 px-2.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {ESTADO_LABELS[e]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
