import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PanelAsignar } from '@/components/visitas/PanelAsignar';
import { TablaSeguimiento } from '@/components/visitas/TablaSeguimiento';
import { TablaConfirmados } from '@/components/visitas/TablaConfirmados';
import { FiltroEstados } from '@/components/visitas/FiltroEstados';
import { CalendarDays, ClipboardList, CheckCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export default function PanelVisitas() {
  const [estadosFiltrados, setEstadosFiltrados] = useState<string[]>(['pendiente', 'asignado', 'en_espera', 'confirmado']);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-panel-header text-panel-header-foreground shadow-soft">
        <div className="container flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-5">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-primary-foreground/10 p-2.5">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Panel de Visitas</h1>
              <p className="text-sm opacity-60 font-medium">Gestión y asignación de turnos grupales</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <FiltroEstados value={estadosFiltrados} onChange={setEstadosFiltrados} />
            <div className="h-8 w-px bg-primary-foreground/20 hidden sm:block mx-1"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground gap-2 shrink-0"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <Tabs defaultValue="asignar" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3 h-11 bg-muted/60 p-1">
            <TabsTrigger value="asignar" className="flex items-center gap-1.5 font-semibold data-[state=active]:shadow-soft text-[13px]">
              <CalendarDays className="h-4 w-4" />
              Asignar
            </TabsTrigger>
            <TabsTrigger value="seguimiento" className="flex items-center gap-1.5 font-semibold data-[state=active]:shadow-soft text-[13px]">
              <ClipboardList className="h-4 w-4" />
              Seguimiento
            </TabsTrigger>
            <TabsTrigger value="confirmados" className="flex items-center gap-1.5 font-semibold data-[state=active]:shadow-soft text-[13px]">
              <CheckCircle className="h-4 w-4" />
              Confirmados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="asignar" className="animate-fade-up">
            <PanelAsignar estadosFiltrados={estadosFiltrados} />
          </TabsContent>

          <TabsContent value="seguimiento" className="animate-fade-up">
            <div className="rounded-xl border bg-card shadow-soft p-5">
              <h2 className="mb-5 text-lg font-bold tracking-tight">Seguimiento de turnos</h2>
              <TablaSeguimiento estadosFiltrados={estadosFiltrados} />
            </div>
          </TabsContent>

          <TabsContent value="confirmados" className="animate-fade-up">
            <div className="rounded-xl border bg-card shadow-soft p-5">
              <h2 className="mb-5 text-lg font-bold tracking-tight">Turnos asignados y confirmados</h2>
              <TablaConfirmados />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
