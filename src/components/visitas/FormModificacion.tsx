import { useState } from 'react';
import type { AsignacionVisita } from '@/lib/types-visitas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MES_NOMBRE } from '@/lib/types-visitas';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X, Copy } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  asignacion: AsignacionVisita;
  onSave: (data: Partial<AsignacionVisita>) => void;
  onSaveAndDuplicate: (data: Partial<AsignacionVisita>) => void;
  onCancel: () => void;
  saving?: boolean;
  forceDuplicateMode?: boolean;
  slots?: any[];
}

export function FormModificacion({ asignacion, onSave, onSaveAndDuplicate, onCancel, saving, forceDuplicateMode, slots }: Props) {
  const [formData, setFormData] = useState<Partial<AsignacionVisita>>({
    nombre_institucion: asignacion.nombre_institucion 
      ? (forceDuplicateMode ? `${asignacion.nombre_institucion} (Copia #${Math.floor(Math.random() * 1000)})` : asignacion.nombre_institucion)
      : '',
    nombre_empresa: asignacion.nombre_empresa || '',
    nombre_referente: asignacion.nombre_referente || '',
    email_referente: asignacion.email_referente || '',
    telefono_referente: asignacion.telefono_referente || '',
    telefono_institucion: asignacion.telefono_institucion || '',
    rango_etario: asignacion.rango_etario || '',
    cantidad_personas_original: asignacion.cantidad_personas_original || 0,
    mes_solicitado: asignacion.mes_solicitado,
    observaciones: asignacion.observaciones || '',
    coeficiente_aplicado: asignacion.coeficiente_aplicado || 1,
    cupo_calculado: asignacion.cupo_calculado || 0,
    id_plani: asignacion.id_plani || null,
  });

  const formatDateText = (fechaStr: string) => {
    if (!fechaStr) return '';
    return format(parseISO(fechaStr), "EEEE d 'de' MMMM", { locale: es });
  };

  const handleChange = (field: keyof AsignacionVisita, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Recalculate cupo when personas or coeficiente change
      if (field === 'cantidad_personas_original' || field === 'coeficiente_aplicado') {
        const personas = field === 'cantidad_personas_original' ? (value as number) : (prev.cantidad_personas_original || 0);
        const coef = field === 'coeficiente_aplicado' ? (value as number) : (prev.coeficiente_aplicado || 1);
        updated.cupo_calculado = Math.ceil(personas * coef);
      }
      return updated;
    });
  };

  return (
    <div className="space-y-3 bg-card border rounded-xl p-4 shadow-md bg-accent/10 border-accent">
      <div className="flex items-center justify-between pb-1 border-b">
        <h3 className="font-bold text-primary text-sm">
          {forceDuplicateMode ? '📋 Crear Duplicado' : '✏️ Modificar Solicitud'}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">#{asignacion.id_asignacion || 'nuevo'}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancel} disabled={saving}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 text-sm">
        {/* Institución */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Institución</Label>
            <Input className="h-8 text-xs" value={formData.nombre_institucion || ''} onChange={e => handleChange('nombre_institucion', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Empresa / Org.</Label>
            <Input className="h-8 text-xs" value={formData.nombre_empresa || ''} onChange={e => handleChange('nombre_empresa', e.target.value)} />
          </div>
        </div>

        {/* Referente */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Nombre referente</Label>
            <Input className="h-8 text-xs" value={formData.nombre_referente || ''} onChange={e => handleChange('nombre_referente', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Email</Label>
            <Input className="h-8 text-xs" type="email" value={formData.email_referente || ''} onChange={e => handleChange('email_referente', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Tel. Referente</Label>
            <Input className="h-8 text-xs" value={formData.telefono_referente || ''} onChange={e => handleChange('telefono_referente', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tel. Institución</Label>
            <Input className="h-8 text-xs" value={formData.telefono_institucion || ''} onChange={e => handleChange('telefono_institucion', e.target.value)} />
          </div>
        </div>

        {/* Visita */}
        <div className="grid grid-cols-4 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Personas</Label>
            <Input 
              className="h-8 text-xs"
              type="number" 
              value={formData.cantidad_personas_original || ''} 
              onChange={e => handleChange('cantidad_personas_original', parseInt(e.target.value) || 0)} 
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Coeficiente</Label>
            <Input 
              className="h-8 text-xs"
              type="number" 
              step="0.01"
              value={formData.coeficiente_aplicado || ''} 
              onChange={e => handleChange('coeficiente_aplicado', parseFloat(e.target.value) || 1)} 
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cupo calc.</Label>
            <Input 
              className="h-8 text-xs bg-muted font-mono font-bold"
              type="number" 
              value={formData.cupo_calculado || ''} 
              disabled
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Rango Etario</Label>
            <Input className="h-8 text-xs" value={formData.rango_etario || ''} onChange={e => handleChange('rango_etario', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Mes Preferido</Label>
            <Select 
              value={formData.mes_solicitado?.toString() || ''} 
              onValueChange={v => handleChange('mes_solicitado', parseInt(v))}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {Object.entries(MES_NOMBRE).map(([num, nombre]) => (
                  <SelectItem key={num} value={num}>{nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Observaciones</Label>
            <Input className="h-8 text-xs" value={formData.observaciones || ''} onChange={e => handleChange('observaciones', e.target.value)} />
          </div>
        </div>
      </div>

      {slots && slots.length > 0 && typeof formData.id_plani !== 'undefined' && (
        <div className="space-y-1.5 px-1 pb-2 border-b">
          <Label className="text-xs font-semibold text-primary">🗓️ Fecha y Horario (Re-asignación)</Label>
          <Select 
            value={formData.id_plani?.toString() || 'null'} 
            onValueChange={val => handleChange('id_plani', val === 'null' ? null : Number(val))}
          >
            <SelectTrigger className="h-8 text-xs bg-white">
              <SelectValue placeholder="Seleccionar turno..." />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectItem value="null">Sin asignar (Pendiente)</SelectItem>
              {slots.map(s => (
                <SelectItem key={s.id_plani} value={s.id_plani.toString()}>
                  {formatDateText(s.fecha)} - {s.horario} (Cupo disp: {s.cupo_disponible})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t">
        {forceDuplicateMode ? (
          <Button 
            className="flex-1 h-8 text-xs font-semibold" 
            onClick={() => onSave(formData)}
            disabled={saving}
          >
            <Copy className="h-3.5 w-3.5 mr-1" />
            {saving ? 'Duplicando...' : 'Guardar Nuevo Duplicado'}
          </Button>
        ) : (
          <>
            <Button 
              className="flex-1 h-8 text-xs font-semibold" 
              onClick={() => onSave(formData)}
              disabled={saving}
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 h-8 text-xs border-primary/30 text-primary hover:bg-primary/10" 
              onClick={() => onSaveAndDuplicate(formData)}
              disabled={saving}
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              Guardar + Duplicar
            </Button>
          </>
        )}
        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={onCancel} disabled={saving}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
