import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  CartesianGrid
} from 'recharts';
import { DatosProyectados } from '../hooks/useTaxCalculations';

interface Props {
  data: DatosProyectados[];
  desglose: {
    ica: number;
    retefuente: number;
    gmf: number;
    renta: number;
  };
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function TaxCharts({ data, desglose }: Props) {
  const pieData = [
    { name: 'Renta', value: desglose.renta },
    { name: 'ICA', value: desglose.ica },
    { name: 'GMF', value: desglose.gmf },
    { name: 'ReteFuente', value: desglose.retefuente },
  ].filter(d => d.value > 0);

  const barData = data.map(d => ({
    año: d.año.toString(),
    Renta: d.impuestoRenta,
    ICA: d.ica,
    GMF: d.gmf,
  }));

  const formatCurrency = (value: number) => 
    `$${(value / 1000000).toFixed(0)}M`;

  const formatTooltip = (value: number) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).format(value);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análisis Gráfico</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">
            Inicie la simulación para ver los gráficos
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Evolución Tributaria Anual</CardTitle>
          <CardDescription>Impuestos por tipo y año</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="año" className="text-xs" />
              <YAxis tickFormatter={formatCurrency} className="text-xs" />
              <Tooltip 
                formatter={(value: number) => formatTooltip(value)}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="Renta" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="ICA" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="GMF" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribución por Tipo</CardTitle>
          <CardDescription>Participación porcentual</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => 
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatTooltip(value)}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
