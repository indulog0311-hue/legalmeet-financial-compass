import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResultadoTriangulacion } from '@/types/threeStatements';

interface TriangulationStatusItemProps {
  label: string;
  valid: boolean;
}

function TriangulationStatusItem({ label, valid }: TriangulationStatusItemProps) {
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

interface Props {
  triangulacion: ResultadoTriangulacion;
}

export function TriangulationValidator({ triangulacion }: Props) {
  return (
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
          <TriangulationStatusItem 
            label="Balance Cuadra (A=P+E)" 
            valid={triangulacion.validaciones.balanceCuadra} 
          />
          <TriangulationStatusItem 
            label="Flujo Concilia" 
            valid={triangulacion.validaciones.flujoConcilia} 
          />
          <TriangulationStatusItem 
            label="Utilidad Cierra" 
            valid={triangulacion.validaciones.utilidadCierra} 
          />
          <TriangulationStatusItem 
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
  );
}
