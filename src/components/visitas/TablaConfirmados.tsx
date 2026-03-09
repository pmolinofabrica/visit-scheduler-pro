import { useMemo } from 'react';
import { useAsignaciones, useDisponibilidad } from '@/hooks/useVisitas';
import { DIA_SEMANA, MES_NOMBRE } from '@/lib/types-visitas';
import type { AsignacionVisita } from '@/lib/types-visitas';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Calendar, Clock, Users, Building, Phone, Mail, Sun, Moon } from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

export function TablaConfirmados() {
  const { data: asignaciones = [], isLoading } = useAsignaciones();
  const { data: slots = [] } = useDisponibilidad(2026);

  const slotMap = useMemo(() => {
    const m: Record<number, any> = {};
    slots.forEach(s => { m[s.id_plani] = s; });
    return m;
  }, [slots]);

  // Only confirmed + assigned with a slot
  const confirmadas = useMemo(() => {
    return asignaciones
      .filter(a => (a.estado === 'confirmado' || a.estado === 'asignado') && a.id_plani)
      .sort((a, b) => {
        const sa = a.id_plani ? slotMap[a.id_plani] : null;
        const sb = b.id_plani ? slotMap[b.id_plani] : null;
        if (!sa || !sb) return 0;
        const dateComp = sa.fecha.localeCompare(sb.fecha);
        if (dateComp !== 0) return dateComp;
        return sa.id_turno - sb.id_turno;
      });
  }, [asignaciones, slotMap]);

  // Group by date, then by turno
  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, AsignacionVisita[]>>();
    confirmadas.forEach(a => {
      const slot = slotMap[a.id_plani!];
      if (!slot) return;
      const dateKey = slot.fecha;
      const turnoKey = slot.tipo_turno || 'Sin turno';
      if (!map.has(dateKey)) map.set(dateKey, new Map());
      const turnoMap = map.get(dateKey)!;
      if (!turnoMap.has(turnoKey)) turnoMap.set(turnoKey, []);
      turnoMap.get(turnoKey)!.push(a);
    });
    return map;
  }, [confirmadas, slotMap]);

  if (isLoading) return <p className="text-muted-foreground p-4">Cargando...</p>;

  if (grouped.size === 0) {
    return <p className="py-8 text-center text-muted-foreground">No hay turnos confirmados o asignados</p>;
  }

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([dateStr, turnoMap]) => {
        const date = new Date(dateStr + 'T12:00:00');
        const today = isToday(date);
        const tomorrow = isTomorrow(date);
        const past = isPast(date) && !today;
        const slot0 = Object.values(Object.fromEntries(turnoMap))[0]?.[0];
        const slotInfo = slot0?.id_plani ? slotMap[slot0.id_plani] : null;

        return (
          <div
            key={dateStr}
            className={cn(
              'rounded-xl border-2 overflow-hidden',
              today && 'border-primary shadow-lg',
              tomorrow && 'border-semaforo-verde/50',
              past && 'border-border opacity-70',
              !today && !tomorrow && !past && 'border-border'
            )}
          >
            {/* Date header */}
            <div className={cn(
              'px-4 py-3 flex items-center gap-3',
              today && 'bg-primary text-primary-foreground',
              tomorrow && 'bg-semaforo-verde/10',
              past && 'bg-muted',
              !today && !tomorrow && !past && 'bg-card'
            )}>
              <Calendar className="h-5 w-5 shrink-0" />
              <div className="flex-1">
                <span className="font-bold text-base">
                  {slotInfo ? DIA_SEMANA[slotInfo.numero_dia_semana] : ''}{' '}
                  {date.getDate()}/{MES_NOMBRE[date.getMonth() + 1]}
                </span>
                {today && <Badge className="ml-2 bg-primary-foreground text-primary text-[10px]">HOY</Badge>}
                {tomorrow && <Badge className="ml-2 bg-semaforo-verde text-primary-foreground text-[10px]">MAÑANA</Badge>}
                {past && <Badge variant="outline" className="ml-2 text-[10px]">PASADO</Badge>}
              </div>
            </div>

            {/* Turnos within this date */}
            <div className="divide-y">
              {Array.from(turnoMap.entries()).map(([turnoName, assigns]) => {
                const isMorning = turnoName.toLowerCase().includes('mañana') || turnoName.toLowerCase().includes('manana');
                const totalPersonas = assigns.reduce((s, a) => s + a.cantidad_personas_original, 0);
                const totalCupo = assigns.reduce((s, a) => s + a.cupo_calculado, 0);
                const slotRef = assigns[0]?.id_plani ? slotMap[assigns[0].id_plani] : null;

                return (
                  <div key={turnoName} className="px-4 py-3">
                    {/* Turno sub-header */}
                    <div className={cn(
                      'flex items-center gap-2 mb-3 px-3 py-2 rounded-lg',
                      isMorning ? 'bg-semaforo-amarillo/10 border border-semaforo-amarillo/30' : 'bg-espera/10 border border-espera/30'
                    )}>
                      {isMorning ? <Sun className="h-4 w-4 text-semaforo-amarillo" /> : <Moon className="h-4 w-4 text-espera" />}
                      <span className="font-semibold text-sm">{turnoName}</span>
                      {slotRef && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({slotRef.hora_inicio?.slice(0, 5)} - {slotRef.hora_fin?.slice(0, 5)})
                        </span>
                      )}
                      <div className="ml-auto flex gap-3 text-xs">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> {totalPersonas} pers.
                        </span>
                        <span className="font-mono font-bold">Cupo: {Math.round(totalCupo)}</span>
                        <Badge variant="outline" className="text-[10px]">{assigns.length} grupo{assigns.length > 1 ? 's' : ''}</Badge>
                      </div>
                    </div>

                    {/* Assignment cards */}
                    <div className="grid gap-2">
                      {assigns.map(a => (
                        <div
                          key={a.id_asignacion}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm',
                            a.estado === 'confirmado' 
                              ? 'bg-semaforo-verde/5 border-semaforo-verde/30' 
                              : 'bg-card border-border/50'
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="font-semibold truncate">{a.nombre_institucion || '—'}</span>
                              <Badge className={cn('text-[10px] shrink-0', a.estado === 'confirmado' ? 'bg-badge-confirmed text-primary-foreground' : 'bg-badge-assigned text-primary-foreground')}>
                                {a.estado === 'confirmado' ? '✔ Confirmado' : '📋 Asignado'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" /> {a.cantidad_personas_original} pers. (cupo {Math.round(a.cupo_calculado)})
                              </span>
                              {a.nombre_referente && <span>Ref: {a.nombre_referente}</span>}
                              {a.telefono_referente && (
                                <a href={`tel:${a.telefono_referente}`} className="flex items-center gap-0.5 text-primary hover:underline">
                                  <Phone className="h-3 w-3" /> {a.telefono_referente}
                                </a>
                              )}
                              {a.email_referente && (
                                <a href={`mailto:${a.email_referente}`} className="flex items-center gap-0.5 text-primary hover:underline">
                                  <Mail className="h-3 w-3" /> {a.email_referente}
                                </a>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">#{a.id_asignacion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
