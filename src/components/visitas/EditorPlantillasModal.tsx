import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { usePlantillasCorreo, useUpdatePlantillaCorreo } from '@/hooks/useVisitas';
import { Settings, Save } from 'lucide-react';
import { toast } from 'sonner';

export function EditorPlantillasModal() {
  const { data: plantillas, isLoading } = usePlantillasCorreo();
  const updatePlantilla = useUpdatePlantillaCorreo();
  
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'asignacion' | 'confirmacion'>('asignacion');
  
  const [asuntoAsig, setAsuntoAsig] = useState('');
  const [cuerpoAsig, setCuerpoAsig] = useState('');
  
  const [asuntoConf, setAsuntoConf] = useState('');
  const [cuerpoConf, setCuerpoConf] = useState('');

  useEffect(() => {
    if (plantillas && plantillas.length > 0) {
      const asig = plantillas.find(p => p.tipo_correo === 'asignacion');
      const conf = plantillas.find(p => p.tipo_correo === 'confirmacion');
      if (asig) {
        setAsuntoAsig(asig.asunto);
        setCuerpoAsig(asig.cuerpo);
      }
      if (conf) {
        setAsuntoConf(conf.asunto);
        setCuerpoConf(conf.cuerpo);
      }
    }
  }, [plantillas, open]);

  const handleSave = async () => {
    try {
      if (activeTab === 'asignacion') {
        await updatePlantilla.mutateAsync({ tipo_correo: 'asignacion', asunto: asuntoAsig, cuerpo: cuerpoAsig });
      } else {
        await updatePlantilla.mutateAsync({ tipo_correo: 'confirmacion', asunto: asuntoConf, cuerpo: cuerpoConf });
      }
      toast.success('Plantilla actualizada correctamente');
      setOpen(false);
    } catch {
      toast.error('Error al guardar plantilla');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <Settings className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Plantillas</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Editor de Plantillas de Correo</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Cargando plantillas...</div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button size="sm" variant={activeTab === 'asignacion' ? 'default' : 'outline'} onClick={() => setActiveTab('asignacion')}>
                Asignación
              </Button>
              <Button size="sm" variant={activeTab === 'confirmacion' ? 'default' : 'outline'} onClick={() => setActiveTab('confirmacion')}>
                Confirmación
              </Button>
            </div>
            
            <div className="bg-muted/30 p-3 rounded-md text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-primary">Campos Dinámicos soportados:</p>
              <p>{"{{institucion}}"} - Nombre de la escuela/grupo</p>
              <p>{"{{referente}}"} - Nombre del responsable del grupo</p>
              <p>{"{{fecha}}"} - Fecha asignada (DD/MM/YYYY)</p>
              <p>{"{{turno}}"} - Turno (Mañana o Tarde)</p>
              <p>{"{{visitantes}}"} - Cantidad de asistentes</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Asunto del correo</label>
              <Input 
                value={activeTab === 'asignacion' ? asuntoAsig : asuntoConf} 
                onChange={e => activeTab === 'asignacion' ? setAsuntoAsig(e.target.value) : setAsuntoConf(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Cuerpo del correo</label>
              <Textarea 
                value={activeTab === 'asignacion' ? cuerpoAsig : cuerpoConf}
                onChange={e => activeTab === 'asignacion' ? setCuerpoAsig(e.target.value) : setCuerpoConf(e.target.value)}
                className="min-h-[250px] font-mono text-sm leading-relaxed"
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={updatePlantilla.isPending} className="gap-2">
                <Save className="h-4 w-4" /> Guardar Cambios
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
