import { useMemo } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { AlertCard } from '@/components/alerts/AlertCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, AlertCircle, Info, Shield, CheckCircle2 } from 'lucide-react';
import { Alerta } from '@/types';
import { calcularProyeccionAnual } from '@/lib/calculations/motorFinanciero';
import { BENCHMARKS } from '@/lib/constants/benchmarks';
import { v4 as uuidv4 } from 'uuid';

export function Alertas() {
  const { 
    config, 
    volumenes, 
    parametrosMacro, 
    catalogoIngresos,
    catalogoOPEX,
    simulacionActiva 
  } = useSimuladorStore();

  // Generar alertas basadas en los datos reales del simulador
  const alertas = useMemo((): Alerta[] => {
    if (!simulacionActiva) return [];

    const alertasGeneradas: Alerta[] = [];
    const año = config.añoInicio;
    const volAño = volumenes[año] || {};
    const proyeccion = calcularProyeccionAnual(año, volAño, config, parametrosMacro, catalogoIngresos);
    
    // Calcular métricas
    const ingresosMensuales = proyeccion.totales.ingresosBrutos / 12;
    const costosMensuales = (proyeccion.totales.totalCostosDirectos + proyeccion.totales.totalOPEX) / 12;
    const burnRate = Math.max(0, costosMensuales - ingresosMensuales);
    const runway = burnRate > 0 ? config.capitalInicial / burnRate : 999;
    
    // Nómina mensual
    const nominaMensual = catalogoOPEX
      .filter(g => g.esNomina)
      .reduce((sum, g) => sum + g.valorUnitario, 0);
    
    // 1. Runway Crítico
    if (runway < BENCHMARKS.RUNWAY_MINIMO_MESES) {
      alertasGeneradas.push({
        id: uuidv4(),
        severidad: 'CRITICA',
        categoria: 'Liquidez',
        titulo: 'Runway Crítico: Menos de 6 Meses',
        descripcion: `Con burn rate actual de $${Math.round(burnRate).toLocaleString()}/mes, solo quedan ${runway.toFixed(1)} meses de operación.`,
        valor_actual: runway,
        benchmark: BENCHMARKS.RUNWAY_MINIMO_MESES,
        accion_recomendada: 'URGENTE: Activar ronda de financiación o reducir burn 40%',
        fecha: new Date()
      });
    }
    
    // 2. Margen Bruto Bajo
    if (proyeccion.totales.margenBrutoPct < 40) {
      alertasGeneradas.push({
        id: uuidv4(),
        severidad: proyeccion.totales.margenBrutoPct < 20 ? 'CRITICA' : 'ALTA',
        categoria: 'Rentabilidad',
        titulo: 'Margen Bruto Bajo',
        descripcion: `Margen bruto de ${proyeccion.totales.margenBrutoPct.toFixed(1)}% está por debajo del benchmark SaaS (40%).`,
        valor_actual: proyeccion.totales.margenBrutoPct,
        benchmark: 40,
        accion_recomendada: 'Revisar estructura de costos directos y precios',
        fecha: new Date()
      });
    }
    
    // 3. EBITDA Negativo
    if (proyeccion.totales.margenEBITDAPct < 0) {
      alertasGeneradas.push({
        id: uuidv4(),
        severidad: 'CRITICA',
        categoria: 'Rentabilidad',
        titulo: 'EBITDA Negativo',
        descripcion: `El EBITDA es negativo (${proyeccion.totales.margenEBITDAPct.toFixed(1)}%). La operación no es rentable.`,
        valor_actual: proyeccion.totales.margenEBITDAPct,
        benchmark: 20,
        accion_recomendada: 'Reducir OPEX o aumentar volumen de ventas significativamente',
        fecha: new Date()
      });
    }
    
    // 4. Churn Alto
    if (config.tasaChurnMensual > BENCHMARKS.CHURN_MAXIMO) {
      alertasGeneradas.push({
        id: uuidv4(),
        severidad: 'ALTA',
        categoria: 'Eficiencia',
        titulo: 'Churn Mensual Elevado',
        descripcion: `Churn configurado: ${(config.tasaChurnMensual * 100).toFixed(1)}% (máximo recomendado: 7%)`,
        valor_actual: config.tasaChurnMensual * 100,
        benchmark: BENCHMARKS.CHURN_MAXIMO * 100,
        accion_recomendada: 'Implementar programa de retención y mejorar NPS',
        fecha: new Date()
      });
    }
    
    // 5. Nómina Insuficiente (equipo pequeño)
    if (nominaMensual < 30000000) {
      alertasGeneradas.push({
        id: uuidv4(),
        severidad: 'MEDIA',
        categoria: 'Eficiencia',
        titulo: 'Equipo Subestimado',
        descripcion: `Nómina mensual de $${nominaMensual.toLocaleString()} puede ser insuficiente para operar.`,
        valor_actual: nominaMensual,
        benchmark: 30000000,
        accion_recomendada: 'Revisar si el equipo es suficiente para el volumen proyectado',
        fecha: new Date()
      });
    }
    
    // Ordenar por severidad
    const orden = { 'CRITICA': 0, 'ALTA': 1, 'MEDIA': 2 };
    return alertasGeneradas.sort((a, b) => orden[a.severidad] - orden[b.severidad]);
  }, [config, volumenes, parametrosMacro, catalogoIngresos, catalogoOPEX, simulacionActiva]);

  const alertasCriticas = alertas.filter(a => a.severidad === 'CRITICA');
  const alertasAltas = alertas.filter(a => a.severidad === 'ALTA');
  const alertasMedias = alertas.filter(a => a.severidad === 'MEDIA');

  const stats = {
    total: alertas.length,
    criticas: alertasCriticas.length,
    altas: alertasAltas.length,
    medias: alertasMedias.length,
  };

  if (!simulacionActiva) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-accent mx-auto mb-4" />
            <p className="text-lg font-semibold">Inicie la simulación para ver alertas</p>
            <p className="text-sm text-muted-foreground">
              Las alertas se generan basadas en las proyecciones financieras activas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Alertas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-destructive/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{stats.criticas}</p>
                <p className="text-xs text-muted-foreground">Críticas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-warning/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{stats.altas}</p>
                <p className="text-xs text-muted-foreground">Alta Prioridad</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-accent/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Info className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">{stats.medias}</p>
                <p className="text-xs text-muted-foreground">Media Prioridad</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification Badge */}
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="font-medium">Alertas sincronizadas con simuladorStore</span>
            <Badge variant="outline" className="ml-2">
              Datos en tiempo real
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Alerts by Category */}
      <Tabs defaultValue="todas" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="todas">
            Todas
            <Badge variant="secondary" className="ml-2">{stats.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="criticas" className="text-destructive">
            Críticas
            <Badge variant="destructive" className="ml-2">{stats.criticas}</Badge>
          </TabsTrigger>
          <TabsTrigger value="altas">
            Altas
            <Badge className="ml-2 bg-warning text-warning-foreground">{stats.altas}</Badge>
          </TabsTrigger>
          <TabsTrigger value="medias">
            Medias
            <Badge className="ml-2 bg-accent text-accent-foreground">{stats.medias}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="mt-6 space-y-4">
          {alertas.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-semibold">Sin alertas activas</p>
                <p className="text-sm text-muted-foreground">
                  Todos los indicadores están dentro de los rangos saludables
                </p>
              </CardContent>
            </Card>
          ) : (
            alertas.map(alerta => (
              <AlertCard key={alerta.id} alerta={alerta} />
            ))
          )}
        </TabsContent>

        <TabsContent value="criticas" className="mt-6 space-y-4">
          {alertasCriticas.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No hay alertas críticas</p>
              </CardContent>
            </Card>
          ) : (
            alertasCriticas.map(alerta => (
              <AlertCard key={alerta.id} alerta={alerta} />
            ))
          )}
        </TabsContent>

        <TabsContent value="altas" className="mt-6 space-y-4">
          {alertasAltas.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No hay alertas de alta prioridad</p>
              </CardContent>
            </Card>
          ) : (
            alertasAltas.map(alerta => (
              <AlertCard key={alerta.id} alerta={alerta} />
            ))
          )}
        </TabsContent>

        <TabsContent value="medias" className="mt-6 space-y-4">
          {alertasMedias.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No hay alertas de media prioridad</p>
              </CardContent>
            </Card>
          ) : (
            alertasMedias.map(alerta => (
              <AlertCard key={alerta.id} alerta={alerta} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Benchmark Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Benchmarks de Referencia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
              <p className="font-semibold mb-2">Unit Economics</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>LTV/CAC ≥ 3.0x</li>
                <li>CAC ≤ $100.000</li>
                <li>Churn ≤ 7%</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">Liquidez</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>Runway ≥ 6 meses</li>
                <li>Liquidez corriente ≥ 1.0</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">Rentabilidad</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>Margen Bruto ≥ 40%</li>
                <li>EBITDA ≥ 20%</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">Crecimiento</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>Growth YoY ≥ 20%</li>
                <li>Rule of 40 ≥ 40</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
