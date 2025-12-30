import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DatosProyectados } from '../hooks/useTaxCalculations';

interface Props {
  data: DatosProyectados[];
}

export function TaxProjectionTable({ data }: Props) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(value);

  const formatPercent = (value: number) => `${value.toFixed(2)}%`;

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Proyección Tributaria Anual</CardTitle>
          <CardDescription>
            Inicie la simulación para ver las proyecciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No hay datos disponibles. Active la simulación desde el Dashboard.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Proyección Tributaria Anual</CardTitle>
        <CardDescription>
          Estimación de carga tributaria por año fiscal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Año</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">Utilidad Op.</TableHead>
                <TableHead className="text-right">Renta</TableHead>
                <TableHead className="text-right">ICA</TableHead>
                <TableHead className="text-right">GMF</TableHead>
                <TableHead className="text-right font-semibold">Total</TableHead>
                <TableHead className="text-right">Tasa Ef.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.año}>
                  <TableCell className="font-medium">{row.año}</TableCell>
                  <TableCell className="text-right">
                    ${formatCurrency(row.ingresosBrutos)}
                  </TableCell>
                  <TableCell className="text-right">
                    ${formatCurrency(row.utilidadOperacional)}
                  </TableCell>
                  <TableCell className="text-right text-blue-600">
                    ${formatCurrency(row.impuestoRenta)}
                  </TableCell>
                  <TableCell className="text-right text-amber-600">
                    ${formatCurrency(row.ica)}
                  </TableCell>
                  <TableCell className="text-right text-purple-600">
                    ${formatCurrency(row.gmf)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-destructive">
                    ${formatCurrency(row.totalImpuestos)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercent(row.tasaEfectiva)}
                  </TableCell>
                </TableRow>
              ))}
              {/* Fila de totales */}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right">
                  ${formatCurrency(data.reduce((sum, r) => sum + r.ingresosBrutos, 0))}
                </TableCell>
                <TableCell className="text-right">
                  ${formatCurrency(data.reduce((sum, r) => sum + r.utilidadOperacional, 0))}
                </TableCell>
                <TableCell className="text-right text-blue-600">
                  ${formatCurrency(data.reduce((sum, r) => sum + r.impuestoRenta, 0))}
                </TableCell>
                <TableCell className="text-right text-amber-600">
                  ${formatCurrency(data.reduce((sum, r) => sum + r.ica, 0))}
                </TableCell>
                <TableCell className="text-right text-purple-600">
                  ${formatCurrency(data.reduce((sum, r) => sum + r.gmf, 0))}
                </TableCell>
                <TableCell className="text-right text-destructive">
                  ${formatCurrency(data.reduce((sum, r) => sum + r.totalImpuestos, 0))}
                </TableCell>
                <TableCell className="text-right">
                  {formatPercent(
                    data.reduce((sum, r) => sum + r.totalImpuestos, 0) /
                    Math.max(1, data.reduce((sum, r) => sum + r.ingresosBrutos, 0)) * 100
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
