import { useMemo } from 'react';
import type { AsignacionVisita } from '@/lib/types-visitas';
import { MES_NOMBRE } from '@/lib/types-visitas';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Users, School, Phone } from 'lucide-react';
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
      <div className="py-12 flex flex-col items-center text-center space-y-2">
        <div className="rounded-full bg-muted p-4">
          <School className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          No hay solicitudes pendientes
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1 pb-10">
      {pendientes.map(s => {
        const isSelected = selectedId === s.id_asignacion;
        const phones = [s.telefono_referente, s.telefono_institucion].filter(Boolean);
        
        return (
          <div
            key={s.id_asignacion}
            onClick={() => onSelect(s.id_asignacion)}
            className={cn(
              'w-full rounded-xl border p-3.5 text-left transition-all cursor-pointer group',
              isSelected
                ? 'border-primary bg-accent shadow-elevated ring-1 ring-primary/30'
                : 'bg-card hover:border-primary/30 hover:shadow-soft'
            )}
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <School className={cn("h-4 w-4 shrink-0 transition-colors", isSelected ? "text-primary" : "text-muted-foreground group-hover:text-primary/70")} />
                <span className={cn("font-bold truncate", isSelected ? "text-primary" : "text-foreground")}>
                  {s.nombre_institucion || '—'}
                </span>
              </div>
              <p className="text-sm text-foreground font-medium pl-6 truncate">
                {s.nombre_referente || '—'}
              </p>
              {phones.length > 0 && (
                <div className="flex items-center gap-2 pl-6">
                  <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-xs font-semibold text-muted-foreground">{phones.join(' · ')}</span>
                </div>
              )}
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span className="font-semibold text-foreground">{s.cantidad_personas_original}</span>
                </span>
                <span className="font-mono bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  Cupo {Math.round(s.cupo_calculado)}
                </span>
                {s.rango_etario && (
                  <span className="truncate">{s.rango_etario}</span>
                )}
              </div>
              <Badge 
                variant={isSelected ? "default" : "outline"} 
                className="shrink-0 text-[10px] font-semibold"
              >
                {MES_NOMBRE[s.mes_solicitado || 0] || '—'}
              </Badge>
            </div>

            {isSelected && (
              <div className="animate-fade-up mt-3 pt-3 border-t">
                <SeguimientoLlamados idAsignacion={s.id_asignacion} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
