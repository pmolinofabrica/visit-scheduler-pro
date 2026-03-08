import { useMemo } from 'react';
import type { AsignacionVisita } from '@/lib/types-visitas';
import { MES_NOMBRE } from '@/lib/types-visitas';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Users, School } from 'lucide-react';

interface Props {
  solicitudes: AsignacionVisita[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function ListaSolicitudes({ solicitudes, selectedId, onSelect }: Props) {
  const pendientes = useMemo(() => {
    return solicitudes.filter(s => s.estado === 'pendiente');
  }, [solicitudes]);

  if (pendientes.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No hay solicitudes pendientes
      </p>
    );
  }

  return (
    <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
      {pendientes.map(s => (
        <button
          key={s.id_asignacion}
          onClick={() => onSelect(s.id_asignacion)}
          className={cn(
            'w-full rounded-lg border p-3 text-left transition-all hover:shadow-sm',
            selectedId === s.id_asignacion
              ? 'border-primary bg-primary/5 ring-1 ring-primary'
              : 'hover:border-muted-foreground/30'
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <School className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="font-medium text-sm truncate">{s.nombre_institucion || '—'}</span>
            </div>
            <Badge variant="outline" className="shrink-0 text-xs">
              {MES_NOMBRE[s.mes_solicitado || 0] || '—'}
            </Badge>
          </div>
          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {s.cantidad_personas_original} personas
            </span>
            <span>{s.rango_etario || '—'}</span>
            <span className="font-mono">Cupo: {Math.round(s.cupo_calculado)}</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground truncate">
            {s.nombre_referente} — {s.email_referente}
          </div>
        </button>
      ))}
    </div>
  );
}
