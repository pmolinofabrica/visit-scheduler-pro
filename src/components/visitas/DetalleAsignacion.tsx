import type { AsignacionVisita, SlotDisponibilidad } from '@/lib/types-visitas';
import { ESTADO_LABELS, MES_NOMBRE, DIA_SEMANA } from '@/lib/types-visitas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { X, Phone, Mail, Building, User, Users, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  asignacion: AsignacionVisita;
  slot?: SlotDisponibilidad;
  onClose: () => void;
  hideClose?: boolean;
}

export function DetalleAsignacion({ asignacion: a, slot, onClose, hideClose = false }: Props) {
  const add15Mins = (timeStr?: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + 15);
    return date.toTimeString().slice(0, 5);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs bg-background shadow-sm">
          {ESTADO_LABELS[a.estado]}
        </Badge>
        {!hideClose && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Institución */}
      <div className="space-y-1 bg-muted/50 p-3 rounded-lg border border-border/50">
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-primary shrink-0" />
          <p className="font-bold text-[15px] text-foreground">{a.nombre_institucion || '—'}</p>
        </div>
        {a.nombre_empresa && (
          <p className="text-xs text-muted-foreground pl-6 font-medium">Empresa/Organización: <span className="text-foreground">{a.nombre_empresa}</span></p>
        )}
      </div>

      <Separator />

      {/* Contacto Referente */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-sm font-bold">
          <User className="h-4 w-4 text-primary shrink-0" />
          <span>{a.nombre_referente || '—'}</span>
        </div>
        
        <div className="grid gap-2 pl-6">
          <div className="flex items-center gap-2 text-xs">
            <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground font-medium w-16">Correo:</span>
            {a.email_referente ? (
              <a href={`mailto:${a.email_referente}`} className="font-semibold text-primary hover:underline">{a.email_referente}</a>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground font-medium w-16">Tel. Ref:</span>
            {a.telefono_referente ? (
              <a href={`tel:${a.telefono_referente}`} className="font-semibold text-primary hover:underline">{a.telefono_referente}</a>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground font-medium w-16">Tel. Inst:</span>
            {a.telefono_institucion ? (
              <span className="font-semibold text-foreground">{a.telefono_institucion}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Visita info */}
      <div className="space-y-2.5 text-xs">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>
            <strong className="text-sm">{a.cantidad_personas_original}</strong> personas confirmadas
            <span className="text-primary font-mono ml-2 bg-primary/10 px-1.5 py-0.5 rounded">
              (cupo: {Math.round(a.cupo_calculado)} · coef: {a.coeficiente_aplicado})
            </span>
          </span>
        </div>
        <p className="pl-5 text-muted-foreground">Rango Etario: <span className="font-medium text-foreground">{a.rango_etario || '—'}</span></p>
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>Mes solicitado (preferencia): <span className="font-medium text-foreground">{MES_NOMBRE[a.mes_solicitado || 0] || '—'}</span></span>
        </div>
      </div>

      {/* Turno asignado */}
      {slot && (
        <>
          <Separator />
          <div className="rounded-lg bg-primary/10 border border-primary/30 p-3 text-xs space-y-1 shadow-sm">
            <p className="font-bold text-primary text-sm">
              {DIA_SEMANA[slot.numero_dia_semana]} {new Date(slot.fecha + 'T12:00:00').getDate()}/{MES_NOMBRE[slot.mes]}
            </p>
            <p className="text-foreground font-medium">{slot.tipo_turno} ({slot.hora_inicio?.slice(0, 5)} - {slot.hora_fin?.slice(0, 5)})</p>
          </div>
        </>
      )}

      {/* Tiempos e historial básico */}
      <Separator />
      <div className="space-y-2 text-xs bg-muted/30 p-2.5 rounded-lg border border-border/50">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>Formulario completado: <span className="font-medium text-foreground">{a.created_at ? format(new Date(a.created_at), 'dd/MM/yyyy HH:mm') : '—'}</span></span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>Última acción: <span className="font-medium text-foreground">{a.updated_at ? format(new Date(a.updated_at), 'dd/MM/yyyy HH:mm') : '—'}</span> ({ESTADO_LABELS[a.estado]})</span>
        </div>
      </div>

      {/* Observaciones */}
      {a.observaciones && (
        <div className="text-xs bg-muted/60 p-3 rounded-lg border-l-2 border-l-primary mt-2">
          <p className="font-semibold mb-1 text-foreground">Observaciones / Agente ({a.agente_asigno || '—'}):</p>
          <p className="text-muted-foreground italic leading-relaxed">"{a.observaciones}"</p>
        </div>
      )}
    </div>
  );
}
