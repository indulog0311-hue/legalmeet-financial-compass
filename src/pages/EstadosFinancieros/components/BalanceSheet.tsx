import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { formatCOP } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { BalanceGeneral as BalanceGeneralType } from '@/types/threeStatements';

interface Props {
  data: BalanceGeneralType;
}

export function BalanceSheet({ data }: Props) {
  return (
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
                <TableCell className="text-right font-mono">
                  {formatCOP(data.activos.corrientes.totalCorriente)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-6">Efectivo y Equivalentes</TableCell>
                <TableCell className="text-right font-mono text-success">
                  {formatCOP(data.activos.corrientes.efectivo)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-6">Cuentas por Cobrar</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCOP(data.activos.corrientes.cuentasPorCobrar)}
                </TableCell>
              </TableRow>
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell>ACTIVOS NO CORRIENTES</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCOP(data.activos.noCorrientes.totalNoCorriente)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-6">Propiedad, Planta y Equipo (Neto)</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCOP(data.activos.noCorrientes.propiedadPlantaEquipoNeto)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-6">Software (Neto)</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCOP(data.activos.noCorrientes.softwareNeto)}
                </TableCell>
              </TableRow>
              <TableRow className="font-bold text-lg border-t-2">
                <TableCell>TOTAL ACTIVOS</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCOP(data.activos.totalActivos)}
                </TableCell>
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
                <TableCell className="text-right font-mono">
                  {formatCOP(data.pasivos.corrientes.totalCorriente)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-6">Cuentas por Pagar</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCOP(data.pasivos.corrientes.cuentasPorPagar)}
                </TableCell>
              </TableRow>
              <TableRow className="bg-warning/10">
                <TableCell className="pl-6 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Escrow Abogados (No es nuestro)
                </TableCell>
                <TableCell className="text-right font-mono text-warning">
                  {formatCOP(data.pasivos.corrientes.escrowAbogados)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-6">Impuestos por Pagar</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCOP(data.pasivos.corrientes.impuestosPorPagar)}
                </TableCell>
              </TableRow>
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell>PATRIMONIO</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCOP(data.patrimonio.totalPatrimonio)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-6">Capital Social</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCOP(data.patrimonio.capitalSocial)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-6">Reserva Legal</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCOP(data.patrimonio.reservaLegal)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-6">Utilidades Retenidas</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCOP(data.patrimonio.utilidadesRetenidas)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-6">Utilidad del Ejercicio</TableCell>
                <TableCell className={cn(
                  "text-right font-mono",
                  data.patrimonio.utilidadDelEjercicio >= 0 ? "text-success" : "text-destructive"
                )}>
                  {formatCOP(data.patrimonio.utilidadDelEjercicio)}
                </TableCell>
              </TableRow>
              <TableRow className="font-bold text-lg border-t-2">
                <TableCell>TOTAL PASIVOS + PATRIMONIO</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCOP(data.pasivos.totalPasivos + data.patrimonio.totalPatrimonio)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          
          <div className={cn(
            "mt-4 p-3 rounded-lg text-center",
            data.ecuacionPatrimonial.valido ? "bg-success/10" : "bg-destructive/10"
          )}>
            <div className="flex items-center justify-center gap-2">
              {data.ecuacionPatrimonial.valido ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <span className={cn(
                "font-semibold",
                data.ecuacionPatrimonial.valido ? "text-success" : "text-destructive"
              )}>
                Ecuación Patrimonial: A = P + E {data.ecuacionPatrimonial.valido ? '✓' : '✗'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
