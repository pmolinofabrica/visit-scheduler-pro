import { useMemo } from 'react';
import type { AsignacionVisita } from '@/lib/types-visitas';
import { MES_NOMBRE } from '@/lib/types-visitas';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Users, School } from 'lucide-react';
import { SeguimientoLlamados } from './SeguimientoLlamados';

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
    <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-2 pb-10">
      {pendientes.map(s => {
        const isSelected = selectedId === s.id_asignacion;
        return (
          <div
            key={s.id_asignacion}
            onClick={() => onSelect(s.id_asignacion)}
            className={cn(
              'w-full rounded-xl border p-3.5 text-left transition-all cursor-pointer',
              isSelected
                ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/50 scale-[1.02] my-4'
                : 'bg-card hover:border-primary/40 hover:shadow-sm hover:bg-muted/30'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <School className={cn("h-4 w-4 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("font-semibold truncate", isSelected ? "text-base text-primary" : "text-sm")}>
                  {s.nombre_institucion || '—'}
                </span>
              </div>
              <Badge variant={isSelected ? "default" : "outline"} className="shrink-0 text-xs">
                {MES_NOMBRE[s.mes_solicitado || 0] || '—'}
              </Badge>
            </div>
            
            <div className="mt-2.5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span className={isSelected ? "font-bold text-foreground" : "font-medium"}>{s.cantidad_personas_original}</span> personas
              </span>
              <span>Edades: <span className={isSelected ? "font-bold text-foreground" : "font-medium"}>{s.rango_etario || '—'}</span></span>
              <span className="font-mono bg-muted/80 border px-1.5 py-0.5 rounded text-[11px] font-semibold text-foreground">
                Cupo: {Math.round(s.cupo_calculado)}
              </span>
            </div>
            
            <div className="mt-2 text-xs text-muted-foreground truncate bg-background/50 rounded-md p-1.5 border border-muted">
              <span className="font-medium text-foreground">Ref:</span> {s.nombre_referente || '—'} <span className="mx-1">•</span> <span className="text-primary/80">{s.email_referente || 'Sin correo'}</span>
            </div>

            {isSelected && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <SeguimientoLlamados idAsignacion={s.id_asignacion} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
