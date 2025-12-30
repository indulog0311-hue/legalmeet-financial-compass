import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileSpreadsheet, FileText, Download, 
  CheckCircle, Clock, Database, Briefcase 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSimuladorStore } from '@/store/simuladorStore';
import { exportStrategicDocumentPDF } from '@/lib/strategicDocumentExporter';

export function Exportar() {
  const { toast } = useToast();
  const { config } = useSimuladorStore();
  
  const mesesProyectados = (config.añoFin - config.añoInicio + 1) * 12;

  const handleExport = (format: 'excel' | 'pdf') => {
    toast({
      title: format === 'excel' ? 'Exportando a Excel...' : 'Generando PDF...',
      description: 'Esta funcionalidad requiere configurar los volúmenes de ventas.',
    });
  };

  const handleStrategicExport = () => {
    toast({ title: 'Generando documento estratégico...', description: 'Por favor espere.' });
    setTimeout(() => {
      exportStrategicDocumentPDF();
      toast({ title: '✅ Documento generado', description: 'El PDF se ha descargado correctamente.' });
    }, 500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Excel Export */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-bl-full" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-success/10">
                <FileSpreadsheet className="h-6 w-6 text-success" />
              </div>
              <div>
                <CardTitle>Exportar a Excel</CardTitle>
                <CardDescription>Modelo financiero completo</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Incluye 12 hojas:</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-success" />
                  P&L Mensual
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-success" />
                  Balance General
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-success" />
                  Flujo de Caja
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-success" />
                  Catálogo SKU
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-success" />
                  Unit Economics
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-success" />
                  KPIs SaaS
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-success" />
                  Modelo Tributario
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-success" />
                  Supuestos
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Database className="h-4 w-4" />
              Formato: .xlsx con fórmulas
            </div>
            
            <Button 
              className="w-full bg-success hover:bg-success/90"
              onClick={() => handleExport('excel')}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Excel
            </Button>
          </CardContent>
        </Card>

        {/* PDF Export */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 rounded-bl-full" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-destructive/10">
                <FileText className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <CardTitle>Exportar a PDF</CardTitle>
                <CardDescription>Reporte para inversores</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Incluye 10 páginas:</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-destructive" />
                  Resumen Ejecutivo
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-destructive" />
                  Proyección 5 Años
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-destructive" />
                  Unit Economics
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-destructive" />
                  Estados Financieros
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-destructive" />
                  Gráficos de KPIs
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-destructive" />
                  Análisis de Riesgos
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-4 w-4" />
              Formato: PDF optimizado para VC
            </div>
            
            <Button 
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive/10"
              onClick={() => handleExport('pdf')}
            >
              <Download className="h-4 w-4 mr-2" />
              Generar PDF
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Document Export */}
      <Card className="relative overflow-hidden border-primary/30 bg-primary/5">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-bl-full" />
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Documento Estratégico VP Mercado</CardTitle>
              <CardDescription>Análisis completo de capacidades, inversión y propuesta de valor</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-primary" />
              Resumen Ejecutivo
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-primary" />
              Análisis de Capacidades
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-primary" />
              Inversión y ROI
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-primary" />
              Propuesta de Valor
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-primary" />
              Análisis de Mercado
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-primary" />
              Posicionamiento
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-primary" />
              Plan de Marketing
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-primary" />
              Presupuesto $42K
            </div>
          </div>
          
          <Button 
            className="w-full"
            onClick={handleStrategicExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar Documento VP Mercado (PDF)
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información del Modelo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{config.añoInicio}-{config.añoFin}</p>
              <p className="text-xs text-muted-foreground">Período de Proyección</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{mesesProyectados}</p>
              <p className="text-xs text-muted-foreground">Meses Proyectados</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">7</p>
              <p className="text-xs text-muted-foreground">SKUs Configurados</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">15</p>
              <p className="text-xs text-muted-foreground">Alertas Monitoreadas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Note */}
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Badge className="bg-accent text-accent-foreground">Nota</Badge>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Cumplimiento Normativo Colombia</p>
              <p>
                Los estados financieros generados siguen el marco NIIF para PYMES adoptado en Colombia 
                (Decreto 2420 de 2015). Los cálculos tributarios incluyen IVA 19%, Renta 35% y factor 
                prestacional 1.52x para nómina.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
