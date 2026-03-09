import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PanelAsignar } from '@/components/visitas/PanelAsignar';
import { TablaSeguimiento } from '@/components/visitas/TablaSeguimiento';
import { TablaConfirmados } from '@/components/visitas/TablaConfirmados';
import { FiltroEstados } from '@/components/visitas/FiltroEstados';
import { CalendarDays, ClipboardList, CheckCircle } from 'lucide-react';

export default function PanelVisitas() {
  const [estadosFiltrados, setEstadosFiltrados] = useState<string[]>(['asignado', 'en_espera', 'confirmado']);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-panel-header text-panel-header-foreground">
        <div className="container flex items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-6 w-6" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Panel de Visitas</h1>
              <p className="text-sm opacity-70">Gestión y asignación de turnos grupales</p>
            </div>
          </div>
          <FiltroEstados value={estadosFiltrados} onChange={setEstadosFiltrados} />
        </div>
      </header>

      <main className="container py-6">
        <Tabs defaultValue="asignar" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="asignar" className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              Asignar
            </TabsTrigger>
            <TabsTrigger value="seguimiento" className="flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4" />
              Seguimiento
            </TabsTrigger>
            <TabsTrigger value="confirmados" className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              Confirmados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="asignar">
            <PanelAsignar estadosFiltrados={estadosFiltrados} />
          </TabsContent>

          <TabsContent value="seguimiento">
            <div className="rounded-lg border p-4">
              <h2 className="mb-4 text-lg font-semibold">Seguimiento de turnos</h2>
              <TablaSeguimiento estadosFiltrados={estadosFiltrados} />
            </div>
          </TabsContent>

          <TabsContent value="confirmados">
            <div className="rounded-lg border p-4">
              <h2 className="mb-4 text-lg font-semibold">Turnos asignados y confirmados</h2>
              <TablaConfirmados />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
