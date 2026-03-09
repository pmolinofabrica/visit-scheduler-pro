import { useMemo, useState } from 'react';
import type { SlotDisponibilidad, AsignacionVisita } from '@/lib/types-visitas';
import { MES_NOMBRE, DIA_SEMANA } from '@/lib/types-visitas';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, School } from 'lucide-react';

interface Props {
  slots: SlotDisponibilidad[];
  asignaciones: AsignacionVisita[];
  mesSolicitado?: number;
  selectedSlot?: number | null;
  cupoRequerido?: number;
  onSelectSlot: (id_plani: number) => void;
  onSelectAsignacion?: (id_asignacion: number) => void;
}

export function CalendarioAnual({ slots, asignaciones = [], mesSolicitado, selectedSlot, cupoRequerido = 0, onSelectSlot, onSelectAsignacion }: Props) {
  const mesesDisponibles = useMemo(() => {
    return [...new Set(slots.map(s => s.mes))].sort((a, b) => a - b);
  }, [slots]);

  const [mesActivo, setMesActivo] = useState<number>(mesSolicitado || mesesDisponibles[0] || 4);

  // Group asignaciones by id_plani for quick lookup
  const asignacionesPorPlani = useMemo(() => {
    const map: Record<number, AsignacionVisita[]> = {};
    asignaciones
      .filter(a => a.id_plani && a.estado !== 'pendiente' && a.estado !== 'cancelado' && a.estado !== 'duplicado')
      .forEach(a => {
        if (!map[a.id_plani!]) map[a.id_plani!] = [];
        map[a.id_plani!].push(a);
      });
    return map;
  }, [asignaciones]);

  // Group slots by date for the active month
  const fechasConSlots = useMemo(() => {
    const filtered = slots.filter(s => s.mes === mesActivo);
    const grouped: Record<string, SlotDisponibilidad[]> = {};
    filtered.forEach(s => {
      if (!grouped[s.fecha]) grouped[s.fecha] = [];
      grouped[s.fecha].push(s);
    });
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [slots, mesActivo]);

  const idxActual = mesesDisponibles.indexOf(mesActivo);

  const getSemaforoDinamico = (slot: SlotDisponibilidad) => {
    // Si la solicitud actual está sobreescribiendo algo, restamos del cupo disponible
    const cupoRestante = slot.cupo_disponible - cupoRequerido;
    if (cupoRestante > 15) return 'verde';
    if (cupoRestante >= -15) return 'amarillo';
    return 'rojo';
  };

  const getSemaforoColor = (slot: SlotDisponibilidad) => {
    const semaforo = getSemaforoDinamico(slot);
    switch (semaforo) {
      case 'verde': return 'bg-semaforo-verde';
      case 'amarillo': return 'bg-semaforo-amarillo';
      case 'rojo': return 'bg-semaforo-rojo';
      default: return 'bg-muted';
    }
  };

  const getSemaforoBg = (slot: SlotDisponibilidad) => {
    const semaforo = getSemaforoDinamico(slot);
    switch (semaforo) {
      case 'verde': return 'bg-semaforo-verde-bg border-semaforo-verde hover:shadow-md';
      case 'amarillo': return 'bg-semaforo-amarillo-bg border-semaforo-amarillo hover:shadow-md';
      case 'rojo': return 'bg-semaforo-rojo-bg border-semaforo-rojo hover:shadow-md';
      default: return 'bg-muted';
    }
  };

  const truncateName = (name: string | null, max = 18) => {
    if (!name) return '—';
    
    // Abbreviations
    const abbrMap: Record<string, string> = {
      'escuela': 'E.', 'jardín': 'J.', 'jardin': 'J.',
      'primaria': 'P.', 'secundaria': 'S.', 'terciaria': 'T.',
      'universitaria': 'U.', 'instituto': 'I.', 'colegio': 'C.',
      'educación': 'Ed.', 'especial': 'Esp.'
    };
    
    let abbrName = name;
    Object.keys(abbrMap).forEach(key => {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      abbrName = abbrName.replace(regex, abbrMap[key]);
    });
    
    return abbrName.length > max ? abbrName.slice(0, max) + '…' : abbrName;
  };

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
                  .map(slot => {
                    const asignados = asignacionesPorPlani[slot.id_plani] || [];
                    return (
                      <div key={slot.id_plani} className="flex-1 flex flex-col gap-1">
                        <button
                          onClick={() => onSelectSlot(slot.id_plani)}
                          className={cn(
                            'rounded-lg border-2 p-3 text-left transition-all w-full relative',
                            getSemaforoBg(slot),
                            selectedSlot === slot.id_plani && 'ring-2 ring-ring ring-offset-2 scale-[1.02]',
                            mesSolicitado === slot.mes && 'ring-2 ring-primary ring-offset-1 shadow-md'
                          )}
                        >
                          {mesSolicitado === slot.mes && (
                            <span className="absolute -top-2 -right-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                              Solicitado
                            </span>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">
                              {slot.tipo_turno === 'Turno mañana' ? '🌅 Mañana' : '🌆 Tarde'}
                            </span>
                            <span className={cn('h-3 w-3 rounded-full', getSemaforoColor(slot))} />
                          </div>
                          <div className="text-xs mt-1 opacity-80">
                            {add15Mins(slot.hora_inicio)} - {add15Mins(slot.hora_fin)}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 text-xs">
                            <span className="font-bold">{Math.round(slot.cupo_disponible)} disp.</span>
                            {slot.cupo_en_espera > 0 && (
                              <span className="rounded bg-espera-bg px-1 text-espera">
                                {Math.round(slot.cupo_en_espera)} espera
                              </span>
                            )}
                            {slot.residentes_convocados ? (
                              <span className="ml-auto flex items-center justify-center rounded bg-secondary px-1.5 text-[10px] font-medium text-secondary-foreground" title="Residentes convocados">
                                👥 {slot.residentes_convocados}
                              </span>
                            ) : null}
                          </div>
                        </button>

                        {/* Assigned schools for this slot */}
                        {asignados.length > 0 && (
                          <div className="space-y-0.5 pl-1">
                            {asignados.map(a => {
                              const estadoStyles: Record<string, string> = {
                                asignado: 'border-l-badge-assigned bg-badge-assigned/10',
                                confirmado: 'border-l-badge-confirmed bg-badge-confirmed/10',
                                en_espera: 'border-l-badge-waiting bg-badge-waiting/10',
                                cancelado: 'border-l-badge-cancelled bg-badge-cancelled/10 opacity-60',
                              };
                              const style = estadoStyles[a.estado] || '';
                              return (
                                <button
                                  key={a.id_asignacion}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectAsignacion?.(a.id_asignacion);
                                  }}
                                  className={cn(
                                    'w-full text-left rounded border border-border/50 border-l-[3px] px-2 py-1 text-[11px] hover:brightness-95 transition-all',
                                    style
                                  )}
                                >
                                  <div className="flex items-center gap-1">
                                    <School className="h-3 w-3 shrink-0 text-muted-foreground" />
                                    <span className="font-medium truncate">{truncateName(a.nombre_institucion)}</span>
                                    <span className={cn(
                                      'ml-auto text-[9px] font-bold uppercase px-1 rounded',
                                      a.estado === 'asignado' && 'text-badge-assigned',
                                      a.estado === 'confirmado' && 'text-badge-confirmed',
                                      a.estado === 'en_espera' && 'text-badge-waiting',
                                      a.estado === 'cancelado' && 'text-badge-cancelled',
                                    )}>
                                      {ESTADO_LABELS[a.estado]}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-foreground">{a.cantidad_personas_original}p</span>
                                    <span className="text-primary font-mono font-bold">{Math.round(a.cupo_calculado)}c</span>
                                    {a.rango_etario && (
                                      <span className="text-muted-foreground truncate">{a.rango_etario}</span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
