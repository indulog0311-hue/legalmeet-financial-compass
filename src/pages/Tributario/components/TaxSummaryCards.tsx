import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaxTotals } from '../hooks/useTaxCalculations';
import { DollarSign, Percent, TrendingDown, Building2 } from 'lucide-react';

interface Props {
  totales: TaxTotals;
}

export function TaxSummaryCards({ totales }: Props) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).format(value);

  const formatPercent = (value: number) => `${value.toFixed(2)}%`;

  const cards = [
    {
      title: 'Total Impuestos',
      value: formatCurrency(totales.totalImpuestos),
      icon: DollarSign,
      description: 'Carga tributaria anual estimada',
      color: 'text-destructive',
    },
    {
      title: 'ICA Anual',
      value: formatCurrency(totales.totalICA),
      icon: Building2,
      description: 'Industria y Comercio Bogotá',
      color: 'text-amber-500',
    },
    {
      title: 'Impuesto Renta',
      value: formatCurrency(totales.totalRenta),
      icon: TrendingDown,
      description: 'Provisión anual 35%',
      color: 'text-blue-500',
    },
    {
      title: 'Tasa Efectiva',
      value: formatPercent(totales.tasaEfectivaPromedio),
      icon: Percent,
      description: 'Sobre ingresos brutos',
      color: 'text-primary',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
