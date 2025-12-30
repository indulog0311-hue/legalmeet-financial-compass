import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle } from 'lucide-react';
import { formatCOP } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { FlujoDeCaja } from '@/types/threeStatements';

interface Props {
  data: FlujoDeCaja;
}

export function CashFlowStatement({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado de Flujo de Efectivo</CardTitle>
        <CardDescription>Método indirecto - Cifras anuales en COP</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {/* Flujo Operativo */}
            <TableRow className="bg-muted/30 font-semibold">
              <TableCell colSpan={2}>FLUJO DE OPERACIÓN</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">Utilidad Neta</TableCell>
              <TableCell className="text-right font-mono">
                {formatCOP(data.operacion.utilidadNeta)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">(+) Depreciación</TableCell>
              <TableCell className="text-right font-mono">
                {formatCOP(data.operacion.ajustesNoCash.depreciacion)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">(+) Amortización</TableCell>
              <TableCell className="text-right font-mono">
                {formatCOP(data.operacion.ajustesNoCash.amortizacion)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">(+/-) Δ Cuentas por Cobrar</TableCell>
              <TableCell className={cn(
                "text-right font-mono",
                data.operacion.cambiosCapitalTrabajo.deltaCuentasPorCobrar < 0 ? "text-destructive" : ""
              )}>
                {formatCOP(data.operacion.cambiosCapitalTrabajo.deltaCuentasPorCobrar)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">(+/-) Δ Cuentas por Pagar</TableCell>
              <TableCell className="text-right font-mono">
                {formatCOP(data.operacion.cambiosCapitalTrabajo.deltaCuentasPorPagar)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">(+/-) Δ Escrow Abogados</TableCell>
              <TableCell className="text-right font-mono">
                {formatCOP(data.operacion.cambiosCapitalTrabajo.deltaEscrowAbogados)}
              </TableCell>
            </TableRow>
            <TableRow className="font-semibold bg-muted/50">
              <TableCell>= Flujo Operativo</TableCell>
              <TableCell className={cn(
                "text-right font-mono",
                data.operacion.flujoOperativo >= 0 ? "text-success" : "text-destructive"
              )}>
                {formatCOP(data.operacion.flujoOperativo)}
              </TableCell>
            </TableRow>

            {/* Flujo de Inversión */}
            <TableRow className="bg-muted/30 font-semibold">
              <TableCell colSpan={2}>FLUJO DE INVERSIÓN</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">(-) Adquisición PP&E</TableCell>
              <TableCell className="text-right font-mono text-destructive">
                ({formatCOP(Math.abs(data.inversion.adquisicionPPE))})
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">(-) Inversión Software</TableCell>
              <TableCell className="text-right font-mono text-destructive">
                ({formatCOP(Math.abs(data.inversion.inversionSoftware))})
              </TableCell>
            </TableRow>
            <TableRow className="font-semibold">
              <TableCell>= Flujo de Inversión</TableCell>
              <TableCell className="text-right font-mono text-destructive">
                ({formatCOP(Math.abs(data.inversion.flujoInversion))})
              </TableCell>
            </TableRow>

            {/* Flujo de Financiación */}
            <TableRow className="bg-muted/30 font-semibold">
              <TableCell colSpan={2}>FLUJO DE FINANCIACIÓN</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">(+) Emisión de Acciones</TableCell>
              <TableCell className="text-right font-mono">
                {formatCOP(data.financiacion.emisionAcciones)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">(+) Aportes de Socios</TableCell>
              <TableCell className="text-right font-mono">
                {formatCOP(data.financiacion.aportesSocios)}
              </TableCell>
            </TableRow>
            <TableRow className="font-semibold">
              <TableCell>= Flujo de Financiación</TableCell>
              <TableCell className="text-right font-mono">
                {formatCOP(data.financiacion.flujoFinanciacion)}
              </TableCell>
            </TableRow>

            {/* Resumen */}
            <TableRow className="font-bold text-lg border-t-2">
              <TableCell>VARIACIÓN NETA DE EFECTIVO</TableCell>
              <TableCell className={cn(
                "text-right font-mono",
                data.resumen.flujoNetoTotal >= 0 ? "text-success" : "text-destructive"
              )}>
                {data.resumen.flujoNetoTotal >= 0 ? '+' : ''}{formatCOP(data.resumen.flujoNetoTotal)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">Efectivo Inicial</TableCell>
              <TableCell className="text-right font-mono">
                {formatCOP(data.resumen.efectivoInicial)}
              </TableCell>
            </TableRow>
            <TableRow className="font-bold">
              <TableCell>EFECTIVO FINAL</TableCell>
              <TableCell className="text-right font-mono text-success">
                {formatCOP(data.resumen.efectivoFinal)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div className={cn(
          "mt-4 p-3 rounded-lg text-center",
          data.resumen.conciliaConBalance ? "bg-success/10" : "bg-destructive/10"
        )}>
          <div className="flex items-center justify-center gap-2">
            {data.resumen.conciliaConBalance ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            <span className={cn(
              "font-semibold",
              data.resumen.conciliaConBalance ? "text-success" : "text-destructive"
            )}>
              Concilia con Balance: {data.resumen.conciliaConBalance ? 'SÍ' : 'NO'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
