import type { AsignacionVisita, SlotDisponibilidad } from '@/lib/types-visitas';
import { ESTADO_LABELS, MES_NOMBRE, DIA_SEMANA } from '@/lib/types-visitas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { X, Phone, Mail, Building, User, Users, Calendar, FileText } from 'lucide-react';

interface Props {
  asignacion: AsignacionVisita;
  slot?: SlotDisponibilidad;
  onClose: () => void;
}

export function DetalleAsignacion({ asignacion, slot, onClose }: Props) {
  const a = asignacion;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          {ESTADO_LABELS[a.estado]}
        </Badge>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Institución */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="font-semibold text-sm">{a.nombre_institucion || '—'}</p>
        </div>
        {a.nombre_empresa && (
          <p className="text-xs text-muted-foreground pl-6">Empresa: {a.nombre_empresa}</p>
        )}
      </div>

      <Separator />

      {/* Referente */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium">{a.nombre_referente || '—'}</span>
        </div>
        {a.email_referente && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3 w-3 shrink-0" />
            <a href={`mailto:${a.email_referente}`} className="hover:underline">{a.email_referente}</a>
          </div>
        )}
        {a.telefono_referente && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0" />
            <a href={`tel:${a.telefono_referente}`} className="hover:underline">{a.telefono_referente}</a>
          </div>
        )}
        {a.telefono_institucion && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0" />
            <span>{a.telefono_institucion} (inst.)</span>
          </div>
        )}
      </div>

      <Separator />

      {/* Visita info */}
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span>
            <strong>{a.cantidad_personas_original}</strong> personas
            <span className="text-primary font-mono ml-2">
              (cupo: {Math.round(a.cupo_calculado)} · coef: {a.coeficiente_aplicado})
            </span>
          </span>
        </div>
        {a.rango_etario && (
          <p className="pl-5 text-muted-foreground">Edades: {a.rango_etario}</p>
        )}
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Mes solicitado: {MES_NOMBRE[a.mes_solicitado || 0] || '—'}</span>
        </div>
      </div>

      {/* Turno asignado */}
      {slot && (
        <>
          <Separator />
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-2 text-xs space-y-0.5">
            <p className="font-semibold">
              {DIA_SEMANA[slot.numero_dia_semana]} {new Date(slot.fecha + 'T12:00:00').getDate()}/{MES_NOMBRE[slot.mes]}
            </p>
            <p>{slot.tipo_turno} ({slot.hora_inicio?.slice(0, 5)} - {slot.hora_fin?.slice(0, 5)})</p>
          </div>
        </>
      )}

      {/* Observaciones */}
      {a.observaciones && (
        <>
          <Separator />
          <div className="text-xs">
            <p className="font-medium mb-0.5">Observaciones</p>
            <p className="text-muted-foreground">{a.observaciones}</p>
          </div>
        </>
      )}

      {/* Agente */}
      {a.agente_asigno && (
        <p className="text-xs text-muted-foreground">Asignó: {a.agente_asigno}</p>
      )}
    </div>
  );
}
