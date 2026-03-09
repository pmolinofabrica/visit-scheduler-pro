import { useState } from 'react';
import type { AsignacionVisita } from '@/lib/types-visitas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MES_NOMBRE } from '@/lib/types-visitas';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Save, X, Copy } from 'lucide-react';

interface Props {
  asignacion: AsignacionVisita;
  onSave: (data: Partial<AsignacionVisita>) => void;
  onSaveAndDuplicate: (data: Partial<AsignacionVisita>) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function FormModificacion({ asignacion, onSave, onSaveAndDuplicate, onCancel, saving }: Props) {
  const [formData, setFormData] = useState<Partial<AsignacionVisita>>({
    nombre_institucion: asignacion.nombre_institucion || '',
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
  });

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
    <div className="space-y-4 bg-accent/20 border-2 border-accent p-5 rounded-xl shadow-md animate-in fade-in slide-in-from-top-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-primary text-base">✏️ Modificar Solicitud</h3>
        <span className="text-xs text-muted-foreground font-mono">#{asignacion.id_asignacion}</span>
      </div>
      
      <Separator />

      <div className="grid gap-4 text-sm">
        {/* Institución */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Institución</Label>
          <Input value={formData.nombre_institucion || ''} onChange={e => handleChange('nombre_institucion', e.target.value)} />
        </div>
        
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Empresa / Organización</Label>
          <Input value={formData.nombre_empresa || ''} onChange={e => handleChange('nombre_empresa', e.target.value)} />
        </div>

        <Separator />
        
        {/* Referente */}
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Datos del Referente</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Nombre</Label>
            <Input value={formData.nombre_referente || ''} onChange={e => handleChange('nombre_referente', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Email</Label>
            <Input type="email" value={formData.email_referente || ''} onChange={e => handleChange('email_referente', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Teléfono Referente</Label>
            <Input value={formData.telefono_referente || ''} onChange={e => handleChange('telefono_referente', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Teléfono Institución</Label>
            <Input value={formData.telefono_institucion || ''} onChange={e => handleChange('telefono_institucion', e.target.value)} />
          </div>
        </div>

        <Separator />

        {/* Visita */}
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Datos de la Visita</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Cant. Personas</Label>
            <Input 
              type="number" 
              value={formData.cantidad_personas_original || ''} 
              onChange={e => handleChange('cantidad_personas_original', parseInt(e.target.value) || 0)} 
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Coeficiente</Label>
            <Input 
              type="number" 
              step="0.01"
              value={formData.coeficiente_aplicado || ''} 
              onChange={e => handleChange('coeficiente_aplicado', parseFloat(e.target.value) || 1)} 
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cupo calculado</Label>
            <Input 
              type="number" 
              value={formData.cupo_calculado || ''} 
              disabled
              className="bg-muted font-mono font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Rango Etario</Label>
            <Input value={formData.rango_etario || ''} onChange={e => handleChange('rango_etario', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Mes Preferido</Label>
            <Select 
              value={formData.mes_solicitado?.toString() || ''} 
              onValueChange={v => handleChange('mes_solicitado', parseInt(v))}
            >
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {Object.entries(MES_NOMBRE).map(([num, nombre]) => (
                  <SelectItem key={num} value={num}>{nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Observaciones</Label>
          <Textarea 
            value={formData.observaciones || ''} 
            onChange={e => handleChange('observaciones', e.target.value)} 
            rows={3}
            className="resize-none"
          />
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex gap-2">
          <Button 
            className="flex-1 font-semibold" 
            onClick={() => onSave(formData)}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-1" />
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 font-semibold border-primary/30 text-primary hover:bg-primary/10" 
            onClick={() => onSaveAndDuplicate(formData)}
            disabled={saving}
          >
            <Copy className="h-4 w-4 mr-1" />
            Guardar y Duplicar
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}
