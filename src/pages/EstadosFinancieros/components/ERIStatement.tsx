import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCOP, formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface EstadoResultados {
  ingresosBrutos: number;
  costoVentas: number;
  utilidadBruta: number;
  gastosOperativos: number;
  ebitda: number;
  depreciacionAmortizacion: number;
  ebit: number;
  gastosFinancieros: number;
  utilidadAntesImpuestos: number;
  impuestoRenta: number;
  utilidadNeta: number;
}

interface Props {
  data: EstadoResultados;
  year: number;
}

export function ERIStatement({ data, year }: Props) {
  const rows = [
    { 
      label: 'Ingresos Brutos', 
      value: data.ingresosBrutos, 
      isHeader: true,
      percentage: 100 
    },
    { 
      label: '(-) Costo de Ventas', 
      value: data.costoVentas, 
      isNegative: true,
      indent: true,
      percentage: (data.costoVentas / data.ingresosBrutos) * 100
    },
    { 
      label: '= Utilidad Bruta', 
      value: data.utilidadBruta, 
      isSemiBold: true,
      percentage: (data.utilidadBruta / data.ingresosBrutos) * 100
    },
    { 
      label: '(-) Gastos Operativos', 
      value: data.gastosOperativos, 
      isNegative: true,
      indent: true,
      percentage: (data.gastosOperativos / data.ingresosBrutos) * 100
    },
    { 
      label: '= EBITDA', 
      value: data.ebitda, 
      isHighlight: true,
      percentage: (data.ebitda / data.ingresosBrutos) * 100
    },
    { 
      label: '(-) Depreciación & Amortización', 
      value: data.depreciacionAmortizacion,
      indent: true,
      percentage: (data.depreciacionAmortizacion / data.ingresosBrutos) * 100
    },
    { 
      label: '= EBIT', 
      value: data.ebit, 
      isSemiBold: true,
      percentage: (data.ebit / data.ingresosBrutos) * 100
    },
    { 
      label: '(-) Impuesto de Renta (35%)', 
      value: data.impuestoRenta, 
      isNegative: true,
      indent: true,
      percentage: (data.impuestoRenta / data.ingresosBrutos) * 100
    },
    { 
      label: '= UTILIDAD NETA', 
      value: data.utilidadNeta, 
      isBold: true,
      isResult: true,
      percentage: (data.utilidadNeta / data.ingresosBrutos) * 100
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado de Resultados - {year}</CardTitle>
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
            {rows.map((row, idx) => (
              <TableRow 
                key={idx}
                className={cn(
                  row.isHeader && "font-bold bg-muted/30",
                  row.isHighlight && "font-semibold bg-muted/50",
                  row.isSemiBold && "font-semibold",
                  row.isBold && "font-bold text-lg border-t-2"
                )}
              >
                <TableCell className={row.indent ? "pl-6" : ""}>
                  {row.label}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-mono",
                  row.isNegative && "text-destructive",
                  row.isResult && (row.value >= 0 ? "text-success" : "text-destructive")
                )}>
                  {row.isNegative && '('}
                  {formatCOP(Math.abs(row.value))}
                  {row.isNegative && ')'}
                </TableCell>
                <TableCell className="text-right">
                  {row.isResult || row.isHighlight ? (
                    <Badge variant={row.value >= 0 ? "default" : "destructive"}>
                      {formatPercent(row.percentage)}
                    </Badge>
                  ) : (
                    <span className={row.isHeader ? "" : "text-muted-foreground"}>
                      {formatPercent(row.percentage)}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
