import { useState } from 'react';
import type { AsignacionVisita } from '@/lib/types-visitas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MES_NOMBRE } from '@/lib/types-visitas';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  asignacion: AsignacionVisita;
  onSave: (data: Partial<AsignacionVisita>) => void;
  onCancel: () => void;
}

export function FormEdicionAsignacion({ asignacion, onSave, onCancel }: Props) {
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
  });

  const handleChange = (field: keyof AsignacionVisita, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4 bg-muted/30 border border-primary/20 p-4 rounded-xl shadow-sm">
      <h3 className="font-semibold text-primary">Corregir Datos de Solicitud</h3>
      
      <div className="grid gap-3 text-sm">
        <div>
          <Label>Institución</Label>
          <Input value={formData.nombre_institucion || ''} onChange={e => handleChange('nombre_institucion', e.target.value)} />
        </div>
        <div>
          <Label>Empresa</Label>
          <Input value={formData.nombre_empresa || ''} onChange={e => handleChange('nombre_empresa', e.target.value)} />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Nombre Referente</Label>
            <Input value={formData.nombre_referente || ''} onChange={e => handleChange('nombre_referente', e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={formData.email_referente || ''} onChange={e => handleChange('email_referente', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Teléfono Referente</Label>
            <Input value={formData.telefono_referente || ''} onChange={e => handleChange('telefono_referente', e.target.value)} />
          </div>
          <div>
            <Label>Teléfono Institución</Label>
            <Input value={formData.telefono_institucion || ''} onChange={e => handleChange('telefono_institucion', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Cant. Personas</Label>
            <Input type="number" value={formData.cantidad_personas_original || ''} onChange={e => handleChange('cantidad_personas_original', parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <Label>Rango Etario</Label>
            <Input value={formData.rango_etario || ''} onChange={e => handleChange('rango_etario', e.target.value)} />
          </div>
        </div>

        <div>
          <Label>Mes Preferido</Label>
          <Select 
            value={formData.mes_solicitado?.toString() || ''} 
            onValueChange={v => handleChange('mes_solicitado', parseInt(v))}
          >
            <SelectTrigger><SelectValue placeholder="Seleccionar mes" /></SelectTrigger>
            <SelectContent>
              {Object.entries(MES_NOMBRE).map(([num, nombre]) => (
                <SelectItem key={num} value={num}>{nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Observaciones</Label>
          <Textarea value={formData.observaciones || ''} onChange={e => handleChange('observaciones', e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button size="sm" onClick={() => onSave(formData)}>Guardar Correcciones</Button>
      </div>
    </div>
  );
}