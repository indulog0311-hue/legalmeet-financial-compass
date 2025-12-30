import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatCOP, formatPercent } from '@/lib/formatters';
import { TrendingUp, DollarSign, Users, Percent, Calendar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export function Ingresos() {
  const { 
    config, 
    volumenes, 
    catalogoIngresos, 
    preciosPersonalizados,
    actualizarVolumen,
    simulacionActiva
  } = useSimuladorStore();

  const [añoSeleccionado, setAñoSeleccionado] = useState(config.añoInicio);

  // Generar lista de años del periodo
  const añosDisponibles = useMemo(() => {
    const años = [];
    for (let a = config.añoInicio; a <= config.añoFin; a++) {
      años.push(a);
    }
    return años;
  }, [config.añoInicio, config.añoFin]);

  // Calcular proyección dinámica basada en el periodo seleccionado
  const proyeccionData = useMemo(() => {
    const data: { periodo: string; transaccional: number; recurrente: number; digital: number }[] = [];
    
    for (let año = config.añoInicio; año <= config.añoFin; año++) {
      const volAño = volumenes[año] || {};
      let transaccional = 0;
      let recurrente = 0;
      let digital = 0;
      
      catalogoIngresos.forEach(item => {
        const precio = preciosPersonalizados[item.codigo] ?? item.valorUnitario;
        const volSku = volAño[item.codigo] || {};
        const volTotal = Object.values(volSku).reduce((sum, v) => sum + v, 0);
        const ingreso = volTotal * precio;
        
        // Clasificar por subcategoría
        if (item.subCategoria?.toLowerCase().includes('recurrente') || item.subCategoria?.toLowerCase().includes('suscripción')) {
          recurrente += ingreso;
        } else if (item.subCategoria?.toLowerCase().includes('digital') || item.subCategoria?.toLowerCase().includes('producto')) {
          digital += ingreso;
        } else {
          transaccional += ingreso;
        }
      });
      
      data.push({ periodo: año.toString(), transaccional, recurrente, digital });
    }
    
    return data;
  }, [config.añoInicio, config.añoFin, volumenes, catalogoIngresos, preciosPersonalizados]);

  const totalProyectado = proyeccionData.reduce(
    (sum, d) => sum + d.transaccional + d.recurrente + d.digital, 0
  );

  // Calcular métricas del año seleccionado
  const metricasAño = useMemo(() => {
    const dataAño = proyeccionData.find(d => d.periodo === añoSeleccionado.toString());
    if (!dataAño) return { total: 0, transaccional: 0, recurrente: 0, digital: 0, pctRecurrente: 0 };
    
    const total = dataAño.transaccional + dataAño.recurrente + dataAño.digital;
    return {
      total,
      transaccional: dataAño.transaccional,
      recurrente: dataAño.recurrente,
      digital: dataAño.digital,
      pctRecurrente: total > 0 ? (dataAño.recurrente / total) * 100 : 0
    };
  }, [proyeccionData, añoSeleccionado]);

  // Calcular CAGR
  const cagr = useMemo(() => {
    const primerAño = proyeccionData[0];
    const ultimoAño = proyeccionData[proyeccionData.length - 1];
    if (!primerAño || !ultimoAño) return 0;
    
    const valorInicial = primerAño.transaccional + primerAño.recurrente + primerAño.digital;
    const valorFinal = ultimoAño.transaccional + ultimoAño.recurrente + ultimoAño.digital;
    const años = config.añoFin - config.añoInicio;
    
    if (valorInicial <= 0 || años <= 0) return 0;
    return (Math.pow(valorFinal / valorInicial, 1 / años) - 1) * 100;
  }, [proyeccionData, config.añoInicio, config.añoFin]);

  // Volúmenes del año seleccionado
  const volumenesAño = volumenes[añoSeleccionado] || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header con selector de año */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Proyección de Ingresos</h1>
          <p className="text-muted-foreground mt-1">
            Periodo {config.añoInicio} - {config.añoFin} • Catálogo con {catalogoIngresos.length} SKUs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select 
            value={añoSeleccionado.toString()} 
            onValueChange={(v) => setAñoSeleccionado(parseInt(v))}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {añosDisponibles.map(año => (
                <SelectItem key={año} value={año.toString()}>{año}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatCOP(totalProyectado)}</p>
                <p className="text-xs text-muted-foreground">Total {config.añoInicio}-{config.añoFin}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatPercent(cagr)}</p>
                <p className="text-xs text-muted-foreground">CAGR Proyectado</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Users className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-lg font-bold">{catalogoIngresos.length}</p>
                <p className="text-xs text-muted-foreground">SKUs Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Percent className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatPercent(metricasAño.pctRecurrente)}</p>
                <p className="text-xs text-muted-foreground">Recurrente en {añoSeleccionado}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen del año seleccionado */}
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-accent" />
              <div>
                <p className="font-medium">Desglose {añoSeleccionado}</p>
                <p className="text-xs text-muted-foreground">Ingresos proyectados por tipo</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="gap-1">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Transaccional: {formatCOP(metricasAño.transaccional)}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <span className="w-2 h-2 rounded-full bg-accent" />
                Recurrente: {formatCOP(metricasAño.recurrente)}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <span className="w-2 h-2 rounded-full bg-warning" />
                Digital: {formatCOP(metricasAño.digital)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projection Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            Proyección de Ingresos por Tipo {config.añoInicio}-{config.añoFin}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={proyeccionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="periodo" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => value >= 1e9 ? `${(value / 1e9).toFixed(1)}B` : `${(value / 1e6).toFixed(0)}M`}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCOP(value), '']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="transaccional" 
                  name="Transaccional"
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="recurrente" 
                  name="Recurrente"
                  fill="hsl(var(--accent))" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="digital" 
                  name="Digital"
                  fill="hsl(var(--warning))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Volume Input Grid */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">Volúmenes por SKU - {añoSeleccionado}</CardTitle>
            <Badge variant={simulacionActiva ? 'default' : 'secondary'}>
              {simulacionActiva ? 'Simulación Activa' : 'Configurando'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Los volúmenes se proyectan automáticamente con tasas de crecimiento configuradas. 
            Puede ajustar el volumen del mes 1 para cada SKU.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalogoIngresos.map(item => {
              const volSku = volumenesAño[item.codigo] || {};
              const volMes1 = volSku[1] || 0;
              const volTotal = Object.values(volSku).reduce((sum, v) => sum + v, 0);
              const precio = preciosPersonalizados[item.codigo] ?? item.valorUnitario;
              const ingresoAnual = volTotal * precio;
              
              return (
                <div key={item.codigo} className="p-4 rounded-lg border border-border bg-muted/20">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-sm">{item.concepto}</p>
                      <p className="text-xs text-muted-foreground">{item.codigo}</p>
                    </div>
                    <p className="text-sm font-mono">{formatCOP(precio)}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Vol. Mes 1</span>
                      <span>Vol. Anual: {volTotal.toLocaleString('es-CO')}</span>
                    </div>
                    <Input
                      type="number"
                      placeholder="0"
                      value={volMes1 || ''}
                      onChange={(e) => actualizarVolumen(añoSeleccionado, item.codigo, 1, Number(e.target.value))}
                      className="font-mono h-9"
                    />
                    <p className="text-xs text-right text-muted-foreground">
                      Ingreso {añoSeleccionado}: {formatCOP(ingresoAnual)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}