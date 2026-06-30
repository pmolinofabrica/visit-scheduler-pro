import { useState } from 'react';
import { useCrearSolicitud } from '@/hooks/useVisitas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';

const TIPO_INSTITUCION = [
  'Escuela',
  'Jardin',
  'Centro de dia',
  'Facultad/Universidad/Terciario',
  'Organizacion social',
  'Municipio/Comuna',
  'Otro',
];

const RANGO_ETARIO = [
  'Entre 1 y 3 años',
  'Entre 3 y 5 años',
  'Entre 6 y 8 años',
  'Entre 8 y 10 años',
  'Entre 10 y 12 años',
  'Entre 13 y 16 años',
  '+ de 16 años',
  'Adultos',
];

const AGENDA_AMPLIA_OPTS = [
  'No, la visita es exclusiva a El Molino Fabrica Cultural',
  'Si, tambien queremos conocer otras propuestas',
];

const QUIEN_COORDINA_OPTS = [
  'La visita es organizada por personal de la institucion',
  'La visita es gestionada por agencia de viajes',
];

const initialForm = {
  direccion_email: '',
  nombre_institucion: '',
  tipo_institucion: '',
  provincia: 'Santa Fe',
  departamento: '',
  nombre_referente: '',
  cargo_institucion: '',
  telefono_referente: '',
  telefono_institucion: '',
  email_referente: '',
  cantidad_visitantes: '',
  rango_etario: '',
  mes_visita_preferido: '',
  dias_turnos_preferencia: '',
  disponibilidad_llamados: '',
  agenda_amplia: 'No, la visita es exclusiva a El Molino Fabrica Cultural',
  quien_coordina: 'La visita es organizada por personal de la institucion',
  nombre_coordinador_viaje: '',
  nombre_empresa_organizacion: '',
  telefono_contacto_coordinador: '',
  email_contacto_coordinador: '',
  requerimientos_accesibilidad: '',
  comentarios_observaciones: '',
};

export function FormCrearSolicitud({ onSuccess }: { onSuccess?: () => void }) {
  const [form, setForm] = useState({ ...initialForm });
  const crear = useCrearSolicitud();

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const setSelect = (key: string) => (value: string) =>
    setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nombre_institucion || !form.nombre_referente || !form.email_referente) {
      toast.error('Completá los campos obligatorios: Institución, Referente y Email');
      return;
    }

    try {
      await crear.mutateAsync({
        direccion_email: form.direccion_email || null,
        nombre_institucion: form.nombre_institucion,
        tipo_institucion: form.tipo_institucion || null,
        provincia: form.provincia || null,
        departamento: form.departamento || null,
        nombre_referente: form.nombre_referente,
        cargo_institucion: form.cargo_institucion || null,
        telefono_referente: form.telefono_referente || null,
        telefono_institucion: form.telefono_institucion || null,
        email_referente: form.email_referente,
        cantidad_visitantes: form.cantidad_visitantes ? Number(form.cantidad_visitantes) : null,
        rango_etario: form.rango_etario || null,
        mes_visita_preferido: form.mes_visita_preferido || null,
        dias_turnos_preferencia: form.dias_turnos_preferencia || null,
        disponibilidad_llamados: form.disponibilidad_llamados || null,
        agenda_amplia: form.agenda_amplia || null,
        quien_coordina: form.quien_coordina || null,
        nombre_coordinador_viaje: form.nombre_coordinador_viaje || null,
        nombre_empresa_organizacion: form.nombre_empresa_organizacion || null,
        telefono_contacto_coordinador: form.telefono_contacto_coordinador || null,
        email_contacto_coordinador: form.email_contacto_coordinador || null,
        requerimientos_accesibilidad: form.requerimientos_accesibilidad || null,
        comentarios_observaciones: form.comentarios_observaciones || null,
      });
      setForm({ ...initialForm });
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear la solicitud');
    }
  };

  const isSubmitting = crear.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sección 1: Datos del solicitante */}
      <div>
        <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
          Datos del solicitante
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">
              Institución <span className="text-destructive">*</span>
            </Label>
            <Input className="h-9" value={form.nombre_institucion} onChange={set('nombre_institucion')} required placeholder="Nombre de la institución" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Tipo de institución</Label>
            <Select value={form.tipo_institucion} onValueChange={setSelect('tipo_institucion')}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                {TIPO_INSTITUCION.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Provincia</Label>
            <Input className="h-9" value={form.provincia} onChange={set('provincia')} placeholder="Santa Fe" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Departamento</Label>
            <Input className="h-9" value={form.departamento} onChange={set('departamento')} placeholder="La Capital" />
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs font-semibold">Email de contacto (solicitante)</Label>
            <Input className="h-9" type="email" value={form.direccion_email} onChange={set('direccion_email')} placeholder="correo@ejemplo.com" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Sección 2: Referente */}
      <div>
        <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
          Datos del referente
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">
              Nombre del referente <span className="text-destructive">*</span>
            </Label>
            <Input className="h-9" value={form.nombre_referente} onChange={set('nombre_referente')} required placeholder="Nombre y apellido" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Cargo en la institución</Label>
            <Input className="h-9" value={form.cargo_institucion} onChange={set('cargo_institucion')} placeholder="Docente, Coordinador, etc." />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">
              Email del referente <span className="text-destructive">*</span>
            </Label>
            <Input className="h-9" type="email" value={form.email_referente} onChange={set('email_referente')} required placeholder="correo@ejemplo.com" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Teléfono del referente</Label>
            <Input className="h-9" value={form.telefono_referente} onChange={set('telefono_referente')} placeholder="342 5555555" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Teléfono de la institución</Label>
            <Input className="h-9" value={form.telefono_institucion} onChange={set('telefono_institucion')} placeholder="0342 5555555" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Sección 3: Detalles de la visita */}
      <div>
        <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
          Detalles de la visita
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Cantidad de visitantes</Label>
            <Input className="h-9" type="number" min={1} value={form.cantidad_visitantes} onChange={set('cantidad_visitantes')} placeholder="30" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Rango etario</Label>
            <Select value={form.rango_etario} onValueChange={setSelect('rango_etario')}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                {RANGO_ETARIO.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Mes de visita preferido</Label>
            <Input className="h-9" value={form.mes_visita_preferido} onChange={set('mes_visita_preferido')} placeholder="Ej: Junio" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Días / Turnos de preferencia</Label>
            <Input className="h-9" value={form.dias_turnos_preferencia} onChange={set('dias_turnos_preferencia')} placeholder="Ej: Viernes turno mañana (9 a 11 h)" />
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs font-semibold">Disponibilidad para llamados</Label>
            <Input className="h-9" value={form.disponibilidad_llamados} onChange={set('disponibilidad_llamados')} placeholder="Ej: De 9 a 17" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Sección 4: Organización */}
      <div>
        <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">4</span>
          Organización de la visita
          <span className="text-xs font-normal text-muted-foreground ml-1">(opcional)</span>
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">¿Agenda amplia?</Label>
            <Select value={form.agenda_amplia} onValueChange={setSelect('agenda_amplia')}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {AGENDA_AMPLIA_OPTS.map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">¿Quién coordina?</Label>
            <Select value={form.quien_coordina} onValueChange={setSelect('quien_coordina')}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {QUIEN_COORDINA_OPTS.map(q => (
                  <SelectItem key={q} value={q}>{q}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Nombre del coordinador de viaje</Label>
            <Input className="h-9" value={form.nombre_coordinador_viaje} onChange={set('nombre_coordinador_viaje')} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Empresa / Organización</Label>
            <Input className="h-9" value={form.nombre_empresa_organizacion} onChange={set('nombre_empresa_organizacion')} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Tel. coordinador</Label>
            <Input className="h-9" value={form.telefono_contacto_coordinador} onChange={set('telefono_contacto_coordinador')} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Email coordinador</Label>
            <Input className="h-9" type="email" value={form.email_contacto_coordinador} onChange={set('email_contacto_coordinador')} />
          </div>
        </div>
      </div>

      <Separator />

      {/* Sección 5: Extras */}
      <div>
        <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">5</span>
          Información adicional
          <span className="text-xs font-normal text-muted-foreground ml-1">(opcional)</span>
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 col-span-2">
            <Label className="text-xs font-semibold">Requerimientos de accesibilidad</Label>
            <Textarea value={form.requerimientos_accesibilidad} onChange={set('requerimientos_accesibilidad')} rows={2} placeholder="Ej: Si, silla de ruedas" />
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs font-semibold">Comentarios / Observaciones</Label>
            <Textarea value={form.comentarios_observaciones} onChange={set('comentarios_observaciones')} rows={2} />
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {isSubmitting ? 'Creando solicitud...' : 'Crear solicitud'}
      </Button>
    </form>
  );
}
