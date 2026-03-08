import { useState } from 'react';
import { useSeguimientoLlamados, useCrearSeguimientoLlamado } from '@/hooks/useVisitas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { toast } from 'sonner';

const AGENTES = ['Pablo', 'Vanesa', 'Celina', 'Eugenia', 'Eliana'];

interface Props {
  idAsignacion: number;
}

export function SeguimientoLlamados({ idAsignacion }: Props) {
  const { data: llamados = [], isLoading } = useSeguimientoLlamados(idAsignacion);
  const { mutateAsync: crearLlamado, isPending } = useCrearSeguimientoLlamado();

  const [agente, setAgente] = useState('Pablo');
  const [atendio, setAtendio] = useState(false);
  const [observacionesLlamado, setObservacionesLlamado] = useState('');
  const [fechaLlamado, setFechaLlamado] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!agente) {
      toast.error('Seleccioná un agente');
      return;
    }
    if (llamados.length >= 50) {
      toast.error('Límite de 50 llamados alcanzado');
      return;
    }
    try {
      const fechaHora = new Date(`${fechaLlamado}T${format(new Date(), 'HH:mm:ss')}`).toISOString();
      await crearLlamado({
        id_asignacion: idAsignacion,
        agente,
        atendio,
        observaciones: observacionesLlamado || null,
        fecha_hora: fechaHora,
      });
      setAtendio(false);
      setObservacionesLlamado('');
      setFechaLlamado(format(new Date(), 'yyyy-MM-dd'));
      toast.success('Llamado registrado');
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar llamado');
    }
  };

  return (
    <div className="mt-4 space-y-3 border-t border-primary/20 pt-3" onClick={e => e.stopPropagation()}>
      <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">Seguimiento de Llamados</h4>
      
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Cargando...</p>
      ) : (
        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
          {llamados.map(ll => (
            <div key={ll.id_llamado} className="bg-background/50 border border-muted-foreground/20 rounded-md px-2.5 py-1.5 text-xs shadow-sm space-y-0.5">
              <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                  <span className="text-muted-foreground">{format(new Date(ll.fecha_hora), 'dd/MM HH:mm')}</span>
                  <span className="font-medium px-1.5 bg-muted rounded-sm">{ll.agente}</span>
                </div>
                <span className={ll.atendio ? 'text-semaforo-verde font-semibold bg-semaforo-verde/10 px-1.5 rounded-sm' : 'text-semaforo-rojo font-semibold bg-semaforo-rojo/10 px-1.5 rounded-sm'}>
                  {ll.atendio ? 'Atendió' : 'No atendió'}
                </span>
              </div>
              {ll.observaciones && (
                <p className="text-muted-foreground italic pl-1">"{ll.observaciones}"</p>
              )}
            </div>
          ))}
          {llamados.length === 0 && <p className="text-xs text-muted-foreground italic">Sin llamados registrados.</p>}
        </div>
      )}

      {llamados.length < 50 && (
        <div className="space-y-2 mt-2 pt-2 border-t border-dashed border-primary/20">
          {/* Agent selection */}
          <div className="flex flex-wrap gap-2">
            {AGENTES.map(a => (
              <label key={a} className="flex items-center gap-1 text-xs cursor-pointer">
                <input
                  type="radio"
                  name={`agente-${idAsignacion}`}
                  checked={agente === a}
                  onChange={() => setAgente(a)}
                  className="accent-primary h-3 w-3"
                />
                <span className={agente === a ? 'font-bold text-foreground' : 'text-muted-foreground'}>{a}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="h-7 text-xs px-2 bg-background/50 w-[130px]"
              value={fechaLlamado}
              onChange={e => setFechaLlamado(e.target.value)}
            />
            <div className="flex items-center gap-1.5 shrink-0 bg-background/50 border rounded-md px-2 h-7">
              <Checkbox id={`atendio-${idAsignacion}`} checked={atendio} onCheckedChange={(c) => setAtendio(!!c)} />
              <Label htmlFor={`atendio-${idAsignacion}`} className="text-xs cursor-pointer font-medium">Atendió</Label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Input
              className="h-7 text-xs px-2 bg-background/50 flex-1"
              placeholder="Observaciones del llamado..."
              value={observacionesLlamado}
              onChange={e => setObservacionesLlamado(e.target.value)}
            />
            <Button size="sm" variant="secondary" className="h-7 px-3 text-xs shrink-0 font-medium" onClick={handleAdd} disabled={isPending}>
              + Agregar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
