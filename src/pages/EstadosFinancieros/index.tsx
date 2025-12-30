import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Scale, Banknote, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useFinancialStatements } from './hooks/useFinancialStatements';
import { TriangulationValidator } from './components/TriangulationValidator';
import { IntegratedView } from './components/IntegratedView';
import { ERIStatement } from './components/ERIStatement';
import { BalanceSheet } from './components/BalanceSheet';
import { CashFlowStatement } from './components/CashFlowStatement';

export default function EstadosFinancieros() {
  const {
    selectedYear,
    setSelectedYear,
    simulacionActiva,
    currentModel,
    cashConversion,
    availableYears,
  } = useFinancialStatements();

  if (!simulacionActiva) {
    return (
      <Card className="max-w-md mx-auto mt-12">
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-warning mb-4" />
          <h3 className="text-lg font-semibold mb-2">Simulación no iniciada</h3>
          <p className="text-muted-foreground">
            Inicie la simulación desde Configuración para ver el modelo de tres estados.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!currentModel) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Year Selector */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Modelo de Tres Estados</h1>
          <p className="text-muted-foreground">
            P&L, Balance General y Flujo de Caja interconectados con validación
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {availableYears.map((año) => (
            <button
              key={año}
              onClick={() => setSelectedYear(año)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                selectedYear === año
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              {año}
            </button>
          ))}
        </div>
      </div>

      {/* Triangulation Status */}
      <TriangulationValidator triangulacion={currentModel.triangulacion} />

      {/* Three Statements Tabs */}
      <Tabs defaultValue="integrated" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integrated">
            <Scale className="h-4 w-4 mr-2" />
            Vista Integrada
          </TabsTrigger>
          <TabsTrigger value="pyl">
            <FileText className="h-4 w-4 mr-2" />
            P&L
          </TabsTrigger>
          <TabsTrigger value="balance">
            <Scale className="h-4 w-4 mr-2" />
            Balance
          </TabsTrigger>
          <TabsTrigger value="flujo">
            <Banknote className="h-4 w-4 mr-2" />
            Flujo de Caja
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrated">
          <IntegratedView model={currentModel} cashConversion={cashConversion} />
        </TabsContent>

        <TabsContent value="pyl">
          <ERIStatement data={currentModel.estadoResultados} year={selectedYear} />
        </TabsContent>

        <TabsContent value="balance">
          <BalanceSheet data={currentModel.balanceGeneral} />
        </TabsContent>

        <TabsContent value="flujo">
          <CashFlowStatement data={currentModel.flujoDeCaja} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
