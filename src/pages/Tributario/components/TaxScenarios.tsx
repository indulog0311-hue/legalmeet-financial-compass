import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TaxScenario } from '../hooks/useTaxCalculations';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  escenarios: TaxScenario[];
}

export function TaxScenarios({ escenarios }: Props) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).format(value);

  const getDifferenceIcon = (diff: number) => {
    if (diff > 0) return <TrendingUp className="h-4 w-4 text-destructive" />;
    if (diff < 0) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getDifferenceBadge = (porcentaje: number) => {
    if (porcentaje > 0) {
      return (
        <Badge variant="destructive">
          +{porcentaje.toFixed(1)}%
        </Badge>
      );
    }
    if (porcentaje < 0) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          {porcentaje.toFixed(1)}%
        </Badge>
      );
    }
    return <Badge variant="secondary">Base</Badge>;
  };

  if (escenarios.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparador de Escenarios Tributarios</CardTitle>
          <CardDescription>
            Inicie la simulación para comparar escenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No hay escenarios configurados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparador de Escenarios Tributarios</CardTitle>
        <CardDescription>
          Compare diferentes configuraciones fiscales y su impacto en la carga tributaria
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Escenario</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Total Impuestos</TableHead>
                <TableHead className="text-right">Diferencia</TableHead>
                <TableHead className="text-center">Variación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {escenarios.map((esc, idx) => (
                <TableRow key={idx} className={idx === 0 ? 'bg-muted/30' : ''}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getDifferenceIcon(esc.diferencia)}
                      {esc.nombre}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {esc.descripcion}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(esc.totalImpuestos)}
                  </TableCell>
                  <TableCell className={`text-right font-mono ${
                    esc.diferencia >= 0 ? 'text-destructive' : 'text-green-600'
                  }`}>
                    {esc.diferencia !== 0 && (
                      <>
                        {esc.diferencia >= 0 ? '+' : ''}
                        {formatCurrency(esc.diferencia)}
                      </>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {getDifferenceBadge(esc.porcentajeDiferencia)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Notas:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Zona Franca:</strong> Requiere ubicación en zona franca y cumplimiento de requisitos de inversión y empleo.</li>
            <li>• <strong>ZESE:</strong> Aplica a empresas en Zonas Económicas Sociales Especiales (zonas afectadas por conflicto).</li>
            <li>• Los valores son estimaciones y pueden variar según la situación específica de la empresa.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
