import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSimuladorStore } from '@/store/simuladorStore';
import { calcularProyeccionAnual } from '@/lib/calculations/motorFinanciero';
import {
  generarThreeStatementModel,
  calcularCashConversion
} from '@/lib/calculations/threeStatements';
import { formatCOP, formatPercent } from '@/lib/formatters';
import {
  FileText, Scale, Banknote, CheckCircle2, XCircle,
  AlertTriangle, ArrowRight, Info, TrendingUp, TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TriangulationStatusProps {
  label: string;
  valid: boolean;
  tooltip?: string;
}

function TriangulationStatus({ label, valid, tooltip }: TriangulationStatusProps) {
  return (
    <div className="flex items-center gap-2">
      {valid ? (
        <CheckCircle2 className="h-4 w-4 text-success" />
      ) : (
        <XCircle className="h-4 w-4 text-destructive" />
      )}
      <span className={cn(
        "text-sm",
        valid ? "text-success" : "text-destructive"
      )}>
        {label}
      </span>
    </div>
  );
}

export function ThreeStatementView() {
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  const {
    config,
    volumenes,
    parametrosMacro,
    catalogoIngresos,
    simulacionActiva,
  } = useSimuladorStore();

  // Generate projections for all years
  const proyecciones = useMemo(() => {
    const result: Record<number, ReturnType<typeof calcularProyeccionAnual>> = {};
    const catalogoEfectivo = catalogoIngresos.length > 0 ? catalogoIngresos : undefined;

    for (let año = config.añoInicio; año <= config.añoFin; año++) {
      const volAño = volumenes[año] || {};
      result[año] = calcularProyeccionAnual(año, volAño, config, parametrosMacro, catalogoEfectivo);
    }

    return result;
  }, [config, volumenes, parametrosMacro, catalogoIngresos]);

  // Generate Three-Statement models for all years
  const threeStatements = useMemo(() => {
    const models: Record<number, ReturnType<typeof generarThreeStatementModel>> = {};
    let efectivoAcumulado = config.capitalInicial;
    let ppeAcumulado = 0;
    let softwareAcumulado = 0;
    let depreciacionAcumulada = 0;
    let amortizacionAcumulada = 0;
    let cxcAnterior = 0;
    let cxpAnterior = 0;
    let impuestosAnterior = 0;
    let escrowAnterior = 0;
    let nominaAnterior = 0;
    let utilidadesRetenidas = 0;

    for (let año = config.añoInicio; año <= config.añoFin; año++) {
      const proy = proyecciones[año];
      if (!proy) continue;

      const capex = proy.totales.totalOPEX * 0.05; // 5% of OPEX as CAPEX
      const inversionSoftware = proy.totales.totalOPEX * 0.02;
      const depreciacion = ppeAcumulado * 0.1; // 10% annual depreciation
      const amortizacion = softwareAcumulado * 0.2; // 20% amortization

      // Estimate escrow (40% of revenue goes to lawyers)
      const escrowAbogados = proy.totales.ingresosBrutos * 0.4 / 12; // Monthly balance

      const model = generarThreeStatementModel({
        año,
        ingresosBrutos: proy.totales.ingresosBrutos,
        costoVentas: proy.totales.totalCostosDirectos,
        gastosOperativos: proy.totales.totalOPEX,
        depreciacion,
        amortizacion,
        gastosFinancieros: 0,
        impuestoRenta: Math.max(0, proy.totales.ebitda * 0.35),
        efectivoInicial: efectivoAcumulado,
        capitalSocial: config.capitalInicial,
        reservaLegal: 0,
        utilidadesRetenidas,
        diasCartera: config.diasCartera,
        diasProveedores: config.diasProveedores,
        escrowAbogados,
        capex,
        inversionSoftware,
        ppeAcumulado,
        softwareAcumulado,
        depreciacionAcumulada,
        amortizacionAcumulada,
        cxcAnterior,
        cxpAnterior,
        impuestosAnterior,
        escrowAnterior,
        nominaAnterior,
      });

      models[año] = model;

      // Update cumulative values for next year
      efectivoAcumulado = model.balanceGeneral.activos.corrientes.efectivo;
      ppeAcumulado = model.balanceGeneral.activos.noCorrientes.propiedadPlantaEquipo;
      softwareAcumulado = model.balanceGeneral.activos.noCorrientes.softwareDesarrollo;
      depreciacionAcumulada = model.balanceGeneral.activos.noCorrientes.depreciacionAcumulada;
      amortizacionAcumulada = model.balanceGeneral.activos.noCorrientes.amortizacionAcumulada;
      cxcAnterior = model.balanceGeneral.activos.corrientes.cuentasPorCobrar;
      cxpAnterior = model.balanceGeneral.pasivos.corrientes.cuentasPorPagar;
      impuestosAnterior = model.balanceGeneral.pasivos.corrientes.impuestosPorPagar;
      escrowAnterior = escrowAbogados;
      nominaAnterior = model.balanceGeneral.pasivos.corrientes.nominaPorPagar;
      utilidadesRetenidas += model.estadoResultados.utilidadNeta;
    }

    return models;
  }, [proyecciones, config]);

  // Cash Conversion Cycle for selected year
  const cashConversion = useMemo(() => {
    const model = threeStatements[selectedYear];
    if (!model) return null;

    const ventas30Dias = model.estadoResultados.ingresosBrutos / 12;
    const costos30Dias = model.estadoResultados.costoVentas / 12;

    return calcularCashConversion(
      ventas30Dias,
      model.balanceGeneral.activos.corrientes.cuentasPorCobrar,
      model.balanceGeneral.pasivos.corrientes.cuentasPorPagar,
      costos30Dias
    );
  }, [threeStatements, selectedYear]);

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

  const currentModel = threeStatements[selectedYear];
  if (!currentModel) return null;

  const { estadoResultados, balanceGeneral, flujoDeCaja, triangulacion } = currentModel;

  return (
    <div className="space-y-6">
      {/* Header with Year Selector and Triangulation Status */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Modelo de Tres Estados</h1>
          <p className="text-muted-foreground">
            P&L, Balance General y Flujo de Caja interconectados con validación
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {Object.keys(threeStatements).map((año) => (
              <button
                key={año}
                onClick={() => setSelectedYear(parseInt(año))}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                  selectedYear === parseInt(año)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {año}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Triangulation Validation Card */}
      <Card className={cn(
        "border-2",
        triangulacion.valido ? "border-success/50 bg-success/5" : "border-destructive/50 bg-destructive/5"
      )}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {triangulacion.valido ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
            Triangulación {triangulacion.valido ? 'Válida' : 'Con Errores'}
          </CardTitle>
          <CardDescription>
            Validación de coherencia entre los tres estados financieros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TriangulationStatus
              label="Balance Cuadra (A=P+E)"
              valid={triangulacion.validaciones.balanceCuadra}
            />
            <TriangulationStatus
              label="Flujo Concilia"
              valid={triangulacion.validaciones.flujoConcilia}
            />
            <TriangulationStatus
              label="Utilidad Cierra"
              valid={triangulacion.validaciones.utilidadCierra}
            />
            <TriangulationStatus
              label="Escrow Contabilizado"
              valid={triangulacion.validaciones.escrowConcilia}
            />
          </div>

          {triangulacion.errores.length > 0 && (
            <div className="mt-4 space-y-2">
              {triangulacion.errores.map((error, idx) => (
                <Alert key={idx} variant="destructive" className="py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {error.mensaje}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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

        {/* Integrated View */}
        <TabsContent value="integrated">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* P&L Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-chart-1" />
                  Estado de Resultados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b">
                  <span>Ingresos</span>
                  <span className="font-mono font-medium">{formatCOP(estadoResultados.ingresosBrutos)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">(-) Costo Ventas</span>
                  <span className="font-mono text-destructive">({formatCOP(estadoResultados.costoVentas)})</span>
                </div>
                <div className="flex justify-between py-1 border-b font-medium">
                  <span>Utilidad Bruta</span>
                  <span className="font-mono">{formatCOP(estadoResultados.utilidadBruta)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">(-) OPEX</span>
                  <span className="font-mono text-destructive">({formatCOP(estadoResultados.gastosOperativos)})</span>
                </div>
                <div className="flex justify-between py-1 font-medium bg-muted/50 px-2 rounded">
                  <span>EBITDA</span>
                  <span className="font-mono">{formatCOP(estadoResultados.ebitda)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">(-) D&A</span>
                  <span className="font-mono">({formatCOP(estadoResultados.depreciacionAmortizacion)})</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">(-) Impuestos</span>
                  <span className="font-mono text-destructive">({formatCOP(estadoResultados.impuestoRenta)})</span>
                </div>
                <div className="flex justify-between py-2 border-t-2 font-bold">
                  <span>Utilidad Neta</span>
                  <span className={cn(
                    "font-mono",
                    estadoResultados.utilidadNeta >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {estadoResultados.utilidadNeta < 0 ? '(' : ''}{formatCOP(Math.abs(estadoResultados.utilidadNeta))}{estadoResultados.utilidadNeta < 0 ? ')' : ''}
                  </span>
                </div>
                <div className="flex items-center justify-center pt-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground ml-1">Cierra a Patrimonio</span>
                </div>
              </CardContent>
            </Card>

            {/* Balance Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="h-4 w-4 text-chart-2" />
                  Balance General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Activos</div>
                <div className="flex justify-between py-1">
                  <span>Efectivo</span>
                  <span className="font-mono font-medium text-success">{formatCOP(balanceGeneral.activos.corrientes.efectivo)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Cuentas x Cobrar</span>
                  <span className="font-mono">{formatCOP(balanceGeneral.activos.corrientes.cuentasPorCobrar)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Activos Fijos Neto</span>
                  <span className="font-mono">{formatCOP(balanceGeneral.activos.noCorrientes.totalNoCorriente)}</span>
                </div>
                <div className="flex justify-between py-1 border-b font-medium">
                  <span>Total Activos</span>
                  <span className="font-mono">{formatCOP(balanceGeneral.activos.totalActivos)}</span>
                </div>

                <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold pt-2">Pasivos + Patrimonio</div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Cuentas x Pagar</span>
                  <span className="font-mono">{formatCOP(balanceGeneral.pasivos.corrientes.cuentasPorPagar)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-warning flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Escrow Abogados
                  </span>
                  <span className="font-mono text-warning">{formatCOP(balanceGeneral.pasivos.corrientes.escrowAbogados)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Impuestos x Pagar</span>
                  <span className="font-mono">{formatCOP(balanceGeneral.pasivos.corrientes.impuestosPorPagar)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Nómina por Pagar</span>
                  <span className="font-mono">{formatCOP(balanceGeneral.pasivos.corrientes.nominaPorPagar)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Capital + Utilidades</span>
                  <span className="font-mono">{formatCOP(balanceGeneral.patrimonio.totalPatrimonio)}</span>
                </div>
                <div className="flex justify-between py-1 border-t font-medium">
                  <span>Total P + E</span>
                  <span className="font-mono">{formatCOP(balanceGeneral.pasivos.totalPasivos + balanceGeneral.patrimonio.totalPatrimonio)}</span>
                </div>

                <div className={cn(
                  "flex items-center justify-center py-2 rounded mt-2",
                  balanceGeneral.ecuacionPatrimonial.valido ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                )}>
                  {balanceGeneral.ecuacionPatrimonial.valido ? (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  <span className="text-xs font-medium">
                    A = P + E: {balanceGeneral.ecuacionPatrimonial.valido ? 'CUADRA' : 'DESCUADRADO'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Cash Flow Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-chart-3" />
                  Flujo de Caja
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Operación</div>
                <div className="flex justify-between py-1">
                  <span>Utilidad Neta</span>
                  <span className="font-mono">{formatCOP(flujoDeCaja.operacion.utilidadNeta)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">(+) D&A</span>
                  <span className="font-mono">{formatCOP(flujoDeCaja.operacion.ajustesNoCash.totalAjustes)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">(+/-) Δ Cap. Trabajo</span>
                  <span className={cn(
                    "font-mono",
                    flujoDeCaja.operacion.cambiosCapitalTrabajo.totalCambios >= 0 ? "" : "text-destructive"
                  )}>
                    {flujoDeCaja.operacion.cambiosCapitalTrabajo.totalCambios < 0 ? '(' : ''}
                    {formatCOP(Math.abs(flujoDeCaja.operacion.cambiosCapitalTrabajo.totalCambios))}
                    {flujoDeCaja.operacion.cambiosCapitalTrabajo.totalCambios < 0 ? ')' : ''}
                  </span>
                </div>
                <div className="flex justify-between py-1 font-medium bg-muted/50 px-2 rounded">
                  <span>Flujo Operativo</span>
                  <span className="font-mono">{formatCOP(flujoDeCaja.operacion.flujoOperativo)}</span>
                </div>

                <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold pt-2">Inversión</div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">CAPEX + Software</span>
                  <span className="font-mono text-destructive">({formatCOP(Math.abs(flujoDeCaja.inversion.flujoInversion))})</span>
                </div>

                <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold pt-2">Financiación</div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Aportes/Deuda</span>
                  <span className="font-mono">{formatCOP(flujoDeCaja.financiacion.flujoFinanciacion)}</span>
                </div>

                <div className="flex justify-between py-2 border-t-2 font-bold">
                  <span>Δ Caja</span>
                  <span className={cn(
                    "font-mono",
                    flujoDeCaja.resumen.flujoNetoTotal >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {flujoDeCaja.resumen.flujoNetoTotal >= 0 ? '+' : ''}{formatCOP(flujoDeCaja.resumen.flujoNetoTotal)}
                  </span>
                </div>

                <div className="flex justify-between py-1 text-xs">
                  <span className="text-muted-foreground">Saldo Final</span>
                  <span className="font-mono font-medium">{formatCOP(flujoDeCaja.resumen.efectivoFinal)}</span>
                </div>

                <div className={cn(
                  "flex items-center justify-center py-2 rounded mt-2",
                  flujoDeCaja.resumen.conciliaConBalance ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                )}>
                  {flujoDeCaja.resumen.conciliaConBalance ? (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  <span className="text-xs font-medium">
                    Concilia con Balance: {flujoDeCaja.resumen.conciliaConBalance ? 'SÍ' : 'NO'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cash Conversion Cycle */}
          {cashConversion && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Ciclo de Conversión de Efectivo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold font-mono">{cashConversion.dso.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">DSO (Días Cobro)</p>
                  </div>
                  <div className="text-center text-2xl font-bold text-muted-foreground">+</div>
                  <div className="text-center">
                    <p className="text-2xl font-bold font-mono">{cashConversion.dpo.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">DPO (Días Pago)</p>
                  </div>
                  <div className="text-center text-2xl font-bold text-muted-foreground">=</div>
                  <div className="text-center">
                    <p className={cn(
                      "text-2xl font-bold font-mono",
                      cashConversion.ccc < 0 ? "text-success" : cashConversion.ccc > 10 ? "text-warning" : ""
                    )}>
                      {cashConversion.ccc.toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground">CCC (Días)</p>
                  </div>
                </div>
                <p className="text-sm text-center mt-3 text-muted-foreground">
                  {cashConversion.descripcion}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* P&L Tab */}
        <TabsContent value="pyl">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Resultados - {selectedYear}</CardTitle>
              <CardDescription>Cifras anuales en COP</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/2">Concepto</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">% Ingresos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="font-bold bg-muted/30">
                    <TableCell>Ingresos Brutos</TableCell>
                    <TableCell className="text-right font-mono">{formatCOP(estadoResultados.ingresosBrutos)}</TableCell>
                    <TableCell className="text-right">100.0%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">(-) Costo de Ventas</TableCell>
                    <TableCell className="text-right font-mono text-destructive">({formatCOP(estadoResultados.costoVentas)})</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatPercent((estadoResultados.costoVentas / estadoResultados.ingresosBrutos) * 100)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-semibold">
                    <TableCell>= Utilidad Bruta</TableCell>
                    <TableCell className="text-right font-mono">{formatCOP(estadoResultados.utilidadBruta)}</TableCell>
                    <TableCell className="text-right">
                      {formatPercent((estadoResultados.utilidadBruta / estadoResultados.ingresosBrutos) * 100)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">(-) Gastos Operativos</TableCell>
                    <TableCell className="text-right font-mono text-destructive">({formatCOP(estadoResultados.gastosOperativos)})</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatPercent((estadoResultados.gastosOperativos / estadoResultados.ingresosBrutos) * 100)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-semibold bg-muted/50">
                    <TableCell>= EBITDA</TableCell>
                    <TableCell className="text-right font-mono">{formatCOP(estadoResultados.ebitda)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={estadoResultados.ebitda >= estadoResultados.ingresosBrutos * 0.2 ? "default" : "secondary"}>
                        {formatPercent((estadoResultados.ebitda / estadoResultados.ingresosBrutos) * 100)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">(-) Depreciación & Amortización</TableCell>
                    <TableCell className="text-right font-mono">({formatCOP(estadoResultados.depreciacionAmortizacion)})</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatPercent((estadoResultados.depreciacionAmortizacion / estadoResultados.ingresosBrutos) * 100)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-semibold">
                    <TableCell>= EBIT</TableCell>
                    <TableCell className="text-right font-mono">{formatCOP(estadoResultados.ebit)}</TableCell>
                    <TableCell className="text-right">
                      {formatPercent((estadoResultados.ebit / estadoResultados.ingresosBrutos) * 100)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">(-) Impuesto de Renta (35%)</TableCell>
                    <TableCell className="text-right font-mono text-destructive">({formatCOP(estadoResultados.impuestoRenta)})</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatPercent((estadoResultados.impuestoRenta / estadoResultados.ingresosBrutos) * 100)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-bold text-lg border-t-2">
                    <TableCell>= UTILIDAD NETA</TableCell>
                    <TableCell className={cn(
                      "text-right font-mono",
                      estadoResultados.utilidadNeta >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {estadoResultados.utilidadNeta < 0 ? '(' : ''}{formatCOP(Math.abs(estadoResultados.utilidadNeta))}{estadoResultados.utilidadNeta < 0 ? ')' : ''}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={estadoResultados.utilidadNeta >= 0 ? "default" : "destructive"}>
                        {formatPercent((estadoResultados.utilidadNeta / estadoResultados.ingresosBrutos) * 100)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balance Tab */}
        <TabsContent value="balance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Activos */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell>ACTIVOS CORRIENTES</TableCell>
                      <TableCell className="text-right font-mono">{formatCOP(balanceGeneral.activos.corrientes.totalCorriente)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-6">Efectivo y Equivalentes</TableCell>
                      <TableCell className="text-right font-mono text-success">{formatCOP(balanceGeneral.activos.corrientes.efectivo)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-6">Cuentas por Cobrar</TableCell>
                      <TableCell className="text-right font-mono">{formatCOP(balanceGeneral.activos.corrientes.cuentasPorCobrar)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell>ACTIVOS NO CORRIENTES</TableCell>
                      <TableCell className="text-right font-mono">{formatCOP(balanceGeneral.activos.noCorrientes.totalNoCorriente)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-6">Propiedad, Planta y Equipo (Neto)</TableCell>
                      <TableCell className="text-right font-mono">{formatCOP(balanceGeneral.activos.noCorrientes.propiedadPlantaEquipoNeto)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-6">Software (Neto)</TableCell>
                      <TableCell className="text-right font-mono">{formatCOP(balanceGeneral.activos.noCorrientes.softwareNeto)}</TableCell>
                    </TableRow>
                    <TableRow className="font-bold text-lg border-t-2">
                      <TableCell>TOTAL ACTIVOS</TableCell>
                      <TableCell className="text-right font-mono">{formatCOP(balanceGeneral.activos.totalActivos)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pasivos + Patrimonio */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Pasivos + Patrimonio</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell>PASIVOS CORRIENTES</TableCell>
                      <TableCell className="text-right font-mono">{formatCOP(balanceGeneral.pasivos.corrientes.totalCorriente)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-6">Cuentas por Pagar</TableCell>
                      <TableCell className="text-right font-mono">{formatCOP(balanceGeneral.pasivos.corrientes.cuentasPorPagar)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-warning/10">
                      <TableCell className="pl-6 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        Escrow Abogados (No es nuestro)
                      </TableCell>
                      <TableCell className="text-right font-mono text-warning">{formatCOP(balanceGeneral.pasivos.corrientes.escrowAbogados)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-6">Impuestos por Pagar</TableCell>
                      <TableCell className="text-right font-mono">{formatCOP(balanceGeneral.pasivos.corrientes.impuestosPorPagar)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-6">Nómina por Pagar</TableCell>
                      <TableCell className="text-right font-mono">{formatCOP(balanceGeneral.pasivos.corrientes.nominaPorPagar)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell>PATRIMONIO</TableCell>
                      <TableCell className="text-right font-mono">{formatCOP(balanceGeneral.patrimonio.totalPatrimonio)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-6">Capital Social</TableCell>
                      <TableCell className="text-right font-mono">{formatCOP(balanceGeneral.patrimonio.capitalSocial)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-6">Reserva Legal</TableCell>
                      <TableCell className="text-right font-mono">{formatCOP(balanceGeneral.patrimonio.reservaLegal)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-6">Utilidades Retenidas</TableCell>
                      <TableCell className="text-right font-mono">{formatCOP(balanceGeneral.patrimonio.utilidadesRetenidas)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-6">Utilidad del Ejercicio</TableCell>
                      <TableCell className={cn(
                        "text-right font-mono",
                        balanceGeneral.patrimonio.utilidadDelEjercicio >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {formatCOP(balanceGeneral.patrimonio.utilidadDelEjercicio)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="font-bold text-lg border-t-2">
                      <TableCell>TOTAL PASIVOS + PATRIMONIO</TableCell>
                      <TableCell className="text-right font-mono">{formatCOP(balanceGeneral.pasivos.totalPasivos + balanceGeneral.patrimonio.totalPatrimonio)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <div className={cn(
                  "mt-4 p-3 rounded-lg text-center",
                  balanceGeneral.ecuacionPatrimonial.valido ? "bg-success/10" : "bg-destructive/10"
                )}>
                  <p className={cn(
                    "font-semibold",
                    balanceGeneral.ecuacionPatrimonial.valido ? "text-success" : "text-destructive"
                  )}>
                    {balanceGeneral.ecuacionPatrimonial.valido ? '✓ ECUACIÓN PATRIMONIAL CUADRA' : '✗ ECUACIÓN PATRIMONIAL DESCUADRADA'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Diferencia: {formatCOP(balanceGeneral.ecuacionPatrimonial.diferencia)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cash Flow Tab */}
        <TabsContent value="flujo">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Flujo de Efectivo - {selectedYear}</CardTitle>
              <CardDescription>Método Indirecto - Cifras en COP</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow className="bg-muted/30 font-semibold">
                    <TableCell>FLUJO DE ACTIVIDADES DE OPERACIÓN</TableCell>
                    <TableCell className="text-right font-mono">{formatCOP(flujoDeCaja.operacion.flujoOperativo)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Utilidad Neta</TableCell>
                    <TableCell className="text-right font-mono">{formatCOP(flujoDeCaja.operacion.utilidadNeta)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">(+) Depreciación</TableCell>
                    <TableCell className="text-right font-mono">{formatCOP(flujoDeCaja.operacion.ajustesNoCash.depreciacion)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">(+) Amortización</TableCell>
                    <TableCell className="text-right font-mono">{formatCOP(flujoDeCaja.operacion.ajustesNoCash.amortizacion)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">(+/-) Δ Cuentas por Cobrar</TableCell>
                    <TableCell className={cn(
                      "text-right font-mono",
                      flujoDeCaja.operacion.cambiosCapitalTrabajo.deltaCuentasPorCobrar < 0 ? "text-destructive" : ""
                    )}>
                      {formatCOP(flujoDeCaja.operacion.cambiosCapitalTrabajo.deltaCuentasPorCobrar)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">(+/-) Δ Cuentas por Pagar</TableCell>
                    <TableCell className="text-right font-mono">{formatCOP(flujoDeCaja.operacion.cambiosCapitalTrabajo.deltaCuentasPorPagar)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">(+/-) Δ Escrow Abogados</TableCell>
                    <TableCell className="text-right font-mono">{formatCOP(flujoDeCaja.operacion.cambiosCapitalTrabajo.deltaEscrowAbogados)}</TableCell>
                  </TableRow>

                  <TableRow className="bg-muted/30 font-semibold">
                    <TableCell>FLUJO DE ACTIVIDADES DE INVERSIÓN</TableCell>
                    <TableCell className="text-right font-mono text-destructive">({formatCOP(Math.abs(flujoDeCaja.inversion.flujoInversion))})</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">(-) Adquisición PP&E</TableCell>
                    <TableCell className="text-right font-mono text-destructive">({formatCOP(Math.abs(flujoDeCaja.inversion.adquisicionPPE))})</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">(-) Inversión en Software</TableCell>
                    <TableCell className="text-right font-mono text-destructive">({formatCOP(Math.abs(flujoDeCaja.inversion.inversionSoftware))})</TableCell>
                  </TableRow>

                  <TableRow className="bg-muted/30 font-semibold">
                    <TableCell>FLUJO DE ACTIVIDADES DE FINANCIACIÓN</TableCell>
                    <TableCell className="text-right font-mono">{formatCOP(flujoDeCaja.financiacion.flujoFinanciacion)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">(+) Emisión de Acciones</TableCell>
                    <TableCell className="text-right font-mono">{formatCOP(flujoDeCaja.financiacion.emisionAcciones)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">(+) Aportes de Socios</TableCell>
                    <TableCell className="text-right font-mono">{formatCOP(flujoDeCaja.financiacion.aportesSocios)}</TableCell>
                  </TableRow>

                  <TableRow className="font-bold text-lg border-t-2">
                    <TableCell>CAMBIO NETO EN EFECTIVO</TableCell>
                    <TableCell className={cn(
                      "text-right font-mono",
                      flujoDeCaja.resumen.flujoNetoTotal >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {flujoDeCaja.resumen.flujoNetoTotal >= 0 ? '+' : ''}{formatCOP(flujoDeCaja.resumen.flujoNetoTotal)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Efectivo al Inicio del Período</TableCell>
                    <TableCell className="text-right font-mono">{formatCOP(flujoDeCaja.resumen.efectivoInicial)}</TableCell>
                  </TableRow>
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell>EFECTIVO AL FINAL DEL PERÍODO</TableCell>
                    <TableCell className="text-right font-mono text-success">{formatCOP(flujoDeCaja.resumen.efectivoFinal)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className={cn(
                "mt-4 p-3 rounded-lg text-center",
                flujoDeCaja.resumen.conciliaConBalance ? "bg-success/10" : "bg-destructive/10"
              )}>
                <p className={cn(
                  "font-semibold",
                  flujoDeCaja.resumen.conciliaConBalance ? "text-success" : "text-destructive"
                )}>
                  {flujoDeCaja.resumen.conciliaConBalance ? '✓ CONCILIA CON BALANCE GENERAL' : '✗ NO CONCILIA CON BALANCE'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Efectivo Balance: {formatCOP(balanceGeneral.activos.corrientes.efectivo)} |
                  Diferencia: {formatCOP(flujoDeCaja.resumen.diferenciaConBalance)}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
