import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, Scale, Banknote, CheckCircle2, XCircle, 
  ArrowRight, Info
} from 'lucide-react';
import { formatCOP } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { ThreeStatementModel, CashConversionCycle } from '@/types/threeStatements';

interface Props {
  model: ThreeStatementModel;
  cashConversion: CashConversionCycle | null;
}

export function IntegratedView({ model, cashConversion }: Props) {
  const { estadoResultados, balanceGeneral, flujoDeCaja } = model;

  return (
    <div className="space-y-4">
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
              <span className="text-muted-foreground">Impuestos x Pagar</span>
              <span className="font-mono">{formatCOP(balanceGeneral.pasivos.corrientes.impuestosPorPagar)}</span>
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
                flujoDeCaja.operacion.cambiosCapitalTrabajo.totalCambios < 0 ? "text-destructive" : ""
              )}>
                {formatCOP(flujoDeCaja.operacion.cambiosCapitalTrabajo.totalCambios)}
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
        <Card>
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
              <div className="text-center text-2xl font-bold text-muted-foreground">-</div>
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
    </div>
  );
}
