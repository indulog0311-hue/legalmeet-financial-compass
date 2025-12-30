import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { formatCOP, formatCompact } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface WaterfallDataPoint {
  name: string;
  value: number;
  isTotal?: boolean;
  isSubtotal?: boolean;
}

interface WaterfallChartProps {
  data: WaterfallDataPoint[];
  height?: number;
  showLabels?: boolean;
  className?: string;
}

interface ProcessedDataPoint {
  name: string;
  value: number;
  start: number;
  end: number;
  isPositive: boolean;
  isTotal: boolean;
  isSubtotal: boolean;
  displayValue: number;
}

export function WaterfallChart({ 
  data, 
  height = 320,
  showLabels = true,
  className 
}: WaterfallChartProps) {
  
  const processedData = useMemo((): ProcessedDataPoint[] => {
    let runningTotal = 0;
    
    return data.map((item, index) => {
      const isTotal = item.isTotal || false;
      const isSubtotal = item.isSubtotal || false;
      
      if (isTotal || isSubtotal) {
        // For totals/subtotals, bar starts from 0
        const result = {
          name: item.name,
          value: item.value,
          start: 0,
          end: item.value,
          isPositive: item.value >= 0,
          isTotal,
          isSubtotal,
          displayValue: item.value,
        };
        runningTotal = item.value;
        return result;
      }
      
      // For regular items, bar floats from previous total
      const start = runningTotal;
      const end = runningTotal + item.value;
      runningTotal = end;
      
      return {
        name: item.name,
        value: Math.abs(item.value),
        start: Math.min(start, end),
        end: Math.max(start, end),
        isPositive: item.value >= 0,
        isTotal: false,
        isSubtotal: false,
        displayValue: item.value,
      };
    });
  }, [data]);

  const getBarColor = (entry: ProcessedDataPoint): string => {
    if (entry.isTotal) {
      return entry.isPositive ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))';
    }
    if (entry.isSubtotal) {
      return 'hsl(var(--chart-3))';
    }
    return entry.isPositive ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-1))';
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    
    const entry = payload[0]?.payload as ProcessedDataPoint;
    if (!entry) return null;

    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-sm mb-1">{entry.name}</p>
        <p className={cn(
          "font-mono text-lg font-bold",
          entry.displayValue >= 0 ? "text-success" : "text-destructive"
        )}>
          {entry.displayValue < 0 ? '(' : ''}{formatCOP(Math.abs(entry.displayValue))}{entry.displayValue < 0 ? ')' : ''}
        </p>
        {(entry.isTotal || entry.isSubtotal) && (
          <p className="text-xs text-muted-foreground mt-1">
            {entry.isTotal ? 'Total' : 'Subtotal'}
          </p>
        )}
      </div>
    );
  };

  const CustomLabel = ({ x, y, width, value, entry }: any) => {
    if (!showLabels) return null;
    
    const displayValue = entry?.displayValue ?? value;
    const isNegative = displayValue < 0;
    
    return (
      <text
        x={x + width / 2}
        y={y - 8}
        fill="hsl(var(--foreground))"
        textAnchor="middle"
        fontSize={11}
        fontFamily="var(--font-mono)"
        className="font-medium"
      >
        {isNegative ? '(' : ''}{formatCompact(Math.abs(displayValue))}{isNegative ? ')' : ''}
      </text>
    );
  };

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={processedData}
          margin={{ top: 30, right: 20, left: 20, bottom: 20 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            vertical={false}
          />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            interval={0}
            angle={-15}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => formatCompact(value)}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
          
          {/* Invisible bar for positioning */}
          <Bar 
            dataKey="start" 
            stackId="waterfall" 
            fill="transparent"
            isAnimationActive={false}
          />
          
          {/* Visible waterfall bar */}
          <Bar 
            dataKey="value" 
            stackId="waterfall"
            radius={[4, 4, 0, 0]}
            label={showLabels ? <CustomLabel /> : undefined}
          >
            {processedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getBarColor(entry)}
                stroke={entry.isTotal ? 'hsl(var(--foreground))' : 'none'}
                strokeWidth={entry.isTotal ? 2 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Pre-configured P&L Waterfall
interface PnLWaterfallProps {
  ingresosBrutos: number;
  cogs: number;
  opex: number;
  depreciacion?: number;
  impuestos: number;
  height?: number;
  showLabels?: boolean;
  className?: string;
}

export function PnLWaterfall({
  ingresosBrutos,
  cogs,
  opex,
  depreciacion = 0,
  impuestos,
  height = 320,
  showLabels = true,
  className,
}: PnLWaterfallProps) {
  
  const utilidadBruta = ingresosBrutos - cogs;
  const ebitda = utilidadBruta - opex;
  const ebit = ebitda - depreciacion;
  const utilidadNeta = ebit - impuestos;

  const data: WaterfallDataPoint[] = [
    { name: 'Ingresos', value: ingresosBrutos, isTotal: true },
    { name: 'COGS', value: -cogs },
    { name: 'Utilidad Bruta', value: utilidadBruta, isSubtotal: true },
    { name: 'OPEX', value: -opex },
    { name: 'EBITDA', value: ebitda, isSubtotal: true },
    ...(depreciacion > 0 ? [{ name: 'D&A', value: -depreciacion }] : []),
    { name: 'Impuestos', value: -impuestos },
    { name: 'Utilidad Neta', value: utilidadNeta, isTotal: true },
  ];

  return (
    <WaterfallChart 
      data={data} 
      height={height} 
      showLabels={showLabels}
      className={className}
    />
  );
}

// Legend component for Waterfall charts
export function WaterfallLegend() {
  return (
    <div className="flex items-center justify-center gap-6 text-xs">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-sm bg-[hsl(var(--chart-2))]" />
        <span className="text-muted-foreground">Positivo / Total</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-sm bg-[hsl(var(--chart-1))]" />
        <span className="text-muted-foreground">Negativo (Costo)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-sm bg-[hsl(var(--chart-3))]" />
        <span className="text-muted-foreground">Subtotal</span>
      </div>
    </div>
  );
}
