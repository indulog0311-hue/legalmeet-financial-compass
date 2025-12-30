import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaxSummaryCards } from './components/TaxSummaryCards';
import { TaxProjectionTable } from './components/TaxProjectionTable';
import { TaxCharts } from './components/TaxCharts';
import { TaxScenarios } from './components/TaxScenarios';
import { useTaxCalculations } from './hooks/useTaxCalculations';
import { Calculator, BarChart3, GitCompare, Table2 } from 'lucide-react';

export default function Tributario() {
  const {
    datosProyectados,
    desglose,
    escenarios,
    totales,
    simulacionActiva,
  } = useTaxCalculations();

  if (!simulacionActiva) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Calculator className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Análisis Tributario</h1>
          <p className="text-muted-foreground max-w-md">
            Inicie la simulación desde el Dashboard para ver el análisis tributario completo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Análisis Tributario</h1>
          <p className="text-muted-foreground">
            Proyección de carga tributaria y escenarios fiscales
          </p>
        </div>
      </div>

      <TaxSummaryCards totales={totales} />

      <Tabs defaultValue="proyeccion" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="proyeccion" className="gap-2">
            <Table2 className="h-4 w-4" />
            <span className="hidden sm:inline">Proyección</span>
          </TabsTrigger>
          <TabsTrigger value="graficos" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Gráficos</span>
          </TabsTrigger>
          <TabsTrigger value="escenarios" className="gap-2">
            <GitCompare className="h-4 w-4" />
            <span className="hidden sm:inline">Escenarios</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proyeccion" className="space-y-4">
          <TaxProjectionTable data={datosProyectados} />
        </TabsContent>

        <TabsContent value="graficos" className="space-y-4">
          <TaxCharts data={datosProyectados} desglose={desglose} />
        </TabsContent>

        <TabsContent value="escenarios" className="space-y-4">
          <TaxScenarios escenarios={escenarios} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
