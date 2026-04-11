import { useMemo, useState } from 'react';
import type { SolicitudPendiente } from '@/lib/types-visitas';
import { MES_NOMBRE, parseMesVisitaPreferido } from '@/lib/types-visitas';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { School, Phone, ArrowDownAZ, CalendarDays, Hash, Mail } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  solicitudes: SolicitudPendiente[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

type SortCriteria = 'fecha' | 'mes';

const formatDateLabel = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function ListaSolicitudes({ solicitudes, selectedId, onSelect, onEdit, onDelete, onDuplicate }: Props) {
  const [sortBy, setSortBy] = useState<SortCriteria>('fecha');

  const pendientes = useMemo(() => {
    const list = [...solicitudes];

    list.sort((a, b) => {
      if (sortBy === 'mes') {
        const mesA = parseMesVisitaPreferido(a.mes_visita_preferido) || 99;
        const mesB = parseMesVisitaPreferido(b.mes_visita_preferido) || 99;
        return mesA - mesB;
      }

      const fechaA = new Date(a.marca_temporal || a.created_at || 0).getTime();
      const fechaB = new Date(b.marca_temporal || b.created_at || 0).getTime();
      return fechaB - fechaA;
    });

    return list;
  }, [solicitudes, sortBy]);

  if (pendientes.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center text-center space-y-2">
        <div className="rounded-full bg-muted p-4">
          <School className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          No hay solicitudes pendientes activas
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <span>Ordenar por:</span>
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortCriteria)}>
          <SelectTrigger className="h-8 text-xs border-dashed w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fecha" className="text-xs">
              <div className="flex items-center gap-1.5">
                <ArrowDownAZ className="h-3 w-3" /> Más recientes
              </div>
            </SelectItem>
            <SelectItem value="mes" className="text-xs">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3" /> Mes solicitado
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1 pb-10">
        {pendientes.map(s => {
          const isSelected = selectedId === s.id;
          const phones = [s.telefono_referente, s.telefono_institucion].filter(Boolean);
          const mes = parseMesVisitaPreferido(s.mes_visita_preferido);

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className={cn(
                'w-full rounded-xl border p-3.5 text-left transition-all cursor-pointer group',
                isSelected
                  ? 'border-primary bg-accent shadow-elevated ring-1 ring-primary/30'
                  : 'bg-card hover:border-primary/30 hover:shadow-soft'
              )}
            >
              <div className="space-y-1.5 relative pr-8">
                <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEdit && (
                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded text-muted-foreground hover:bg-muted hover:text-primary" onClick={(e) => { e.stopPropagation(); onEdit(s.id); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                  {onDuplicate && (
                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded text-muted-foreground hover:bg-muted hover:text-primary" onClick={(e) => { e.stopPropagation(); onDuplicate(s.id); }}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 min-w-0 pr-12">
                  <School className={cn('h-4 w-4 shrink-0 transition-colors', isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/70')} />
                  <span className={cn('font-bold truncate', isSelected ? 'text-primary' : 'text-foreground')}>
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
                {s.email_referente && (
                  <div className="flex items-center gap-2 pl-6">
                    <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-xs font-semibold text-muted-foreground truncate">{s.email_referente}</span>
                  </div>
                )}
              </div>

              <div className="mt-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Hash className="h-3.5 w-3.5" />
                    <span className="font-semibold text-foreground">{s.cantidad_visitantes || 0}</span>
                  </span>
                  <span className="font-mono bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded text-[10px] font-bold">
                    {s.rango_etario || 'Sin rango'}
                  </span>
                </div>
                <Badge
                  variant={isSelected ? 'default' : 'outline'}
                  className="shrink-0 text-[10px] font-semibold"
                >
                  {mes ? MES_NOMBRE[mes] : s.mes_visita_preferido || '—'}
                </Badge>
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground pl-1">
                <span>{formatDateLabel(s.marca_temporal || s.created_at)}</span>
                <span>{s.estado_actual || 'Pendiente'}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
