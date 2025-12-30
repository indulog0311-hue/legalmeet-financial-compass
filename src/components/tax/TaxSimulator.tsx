import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { formatCOP, formatPercent } from '@/lib/formatters';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  SlidersHorizontal, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown,
  Calculator,
  Zap,
  Building,
  CreditCard,
  Percent,
  ArrowRight
} from 'lucide-react';

interface TaxSimulatorProps {
  baseIngresos: number;
  baseUtilidad: number;
  baseNomina: number;
}

interface TaxRates {
  renta: number;
  iva: number;
  ica: number;
  gmf: number;
  sobretasa: number;
  pasarela: number;
  parafiscales: number;
}

const DEFAULT_RATES: TaxRates = {
  renta: 35,
  iva: 19,
  ica: 11.04,
  gmf: 4,
  sobretasa: 3,
  pasarela: 2.9,
  parafiscales: 52.08,
};

const RATE_CONFIG = {
  renta: { min: 20, max: 45, step: 1, label: 'Impuesto de Renta', unit: '%', color: 'hsl(0, 84%, 60%)' },
  iva: { min: 10, max: 25, step: 1, label: 'IVA General', unit: '%', color: 'hsl(25, 95%, 53%)' },
  ica: { min: 5, max: 15, step: 0.5, label: 'ICA Bogotá', unit: '‰', color: 'hsl(45, 93%, 47%)' },
  gmf: { min: 0, max: 6, step: 0.5, label: 'GMF (4x1000)', unit: '‰', color: 'hsl(199, 89%, 48%)' },
  sobretasa: { min: 0, max: 6, step: 0.5, label: 'Sobretasa Renta', unit: '%', color: 'hsl(280, 65%, 60%)' },
  pasarela: { min: 1.5, max: 4.5, step: 0.1, label: 'Pasarela Pagos', unit: '%', color: 'hsl(262, 83%, 58%)' },
  parafiscales: { min: 40, max: 65, step: 1, label: 'Factor Prestacional', unit: '%', color: 'hsl(142, 71%, 45%)' },
};

export function TaxSimulator({ baseIngresos, baseUtilidad, baseNomina }: TaxSimulatorProps) {
  const [rates, setRates] = useState<TaxRates>(DEFAULT_RATES);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mixPagoDigital, setMixPagoDigital] = useState(70);

  const handleRateChange = useCallback((key: keyof TaxRates, value: number[]) => {
    setRates(prev => ({ ...prev, [key]: value[0] }));
  }, []);

  const resetRates = useCallback(() => {
    setRates(DEFAULT_RATES);
    setMixPagoDigital(70);
  }, []);

  // Calculate taxes based on current rates
  const calculations = useMemo(() => {
    const movimientosBancarios = baseIngresos * 1.2;
    const transaccionesDigitales = baseIngresos * (mixPagoDigital / 100);

    const impuestoRenta = baseUtilidad * (rates.renta / 100);
    const sobretasaRenta = baseUtilidad > 5000000000 ? baseUtilidad * (rates.sobretasa / 100) : 0;
    const ivaDebito = baseIngresos * (rates.iva / 100);
    const icaBogota = baseIngresos * (rates.ica / 1000);
    const gmf = movimientosBancarios * (rates.gmf / 1000);
    const pasarelaComision = transaccionesDigitales * (rates.pasarela / 100) * 1.19;
    const cargaParafiscal = baseNomina * (rates.parafiscales / 100);

    const totalTributos = impuestoRenta + sobretasaRenta + ivaDebito + icaBogota;
    const totalTransaccional = gmf + pasarelaComision;
    const totalLaboral = cargaParafiscal;
    const granTotal = totalTributos + totalTransaccional + totalLaboral;

    // Default scenario for comparison
    const defaultRenta = baseUtilidad * (DEFAULT_RATES.renta / 100);
    const defaultSobretasa = baseUtilidad > 5000000000 ? baseUtilidad * (DEFAULT_RATES.sobretasa / 100) : 0;
    const defaultIVA = baseIngresos * (DEFAULT_RATES.iva / 100);
    const defaultICA = baseIngresos * (DEFAULT_RATES.ica / 1000);
    const defaultGMF = movimientosBancarios * (DEFAULT_RATES.gmf / 1000);
    const defaultPasarela = transaccionesDigitales * (DEFAULT_RATES.pasarela / 100) * 1.19;
    const defaultParafiscal = baseNomina * (DEFAULT_RATES.parafiscales / 100);
    const defaultTotal = defaultRenta + defaultSobretasa + defaultIVA + defaultICA + defaultGMF + defaultPasarela + defaultParafiscal;

    const diferencia = granTotal - defaultTotal;
    const variacionPct = (diferencia / defaultTotal) * 100;

    return {
      impuestoRenta,
      sobretasaRenta,
      ivaDebito,
      icaBogota,
      gmf,
      pasarelaComision,
      cargaParafiscal,
      totalTributos,
      totalTransaccional,
      totalLaboral,
      granTotal,
      defaultTotal,
      diferencia,
      variacionPct,
      tasaEfectiva: (granTotal / baseIngresos) * 100,
    };
  }, [rates, baseIngresos, baseUtilidad, baseNomina, mixPagoDigital]);

  // Chart data
  const pieData = useMemo(() => [
    { name: 'Renta', value: calculations.impuestoRenta + calculations.sobretasaRenta, color: RATE_CONFIG.renta.color },
    { name: 'IVA', value: calculations.ivaDebito, color: RATE_CONFIG.iva.color },
    { name: 'ICA', value: calculations.icaBogota, color: RATE_CONFIG.ica.color },
    { name: 'GMF', value: calculations.gmf, color: RATE_CONFIG.gmf.color },
    { name: 'Pasarela', value: calculations.pasarelaComision, color: RATE_CONFIG.pasarela.color },
    { name: 'Parafiscales', value: calculations.cargaParafiscal, color: RATE_CONFIG.parafiscales.color },
  ].filter(d => d.value > 0), [calculations]);

  const comparisonData = useMemo(() => [
    { name: 'Actual (Ley)', valor: calculations.defaultTotal / 1000000 },
    { name: 'Simulación', valor: calculations.granTotal / 1000000 },
  ], [calculations]);

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              Simulador Interactivo de Carga Tributaria
            </CardTitle>
            <CardDescription>
              Ajusta las tasas impositivas y observa el impacto en tiempo real
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={resetRates} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Restablecer
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Main Tax Rates */}
            <div className="space-y-5">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Tasas Impositivas Principales
              </h4>

              {/* Renta */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RATE_CONFIG.renta.color }}></span>
                    {RATE_CONFIG.renta.label}
                  </Label>
                  <Badge variant={rates.renta !== DEFAULT_RATES.renta ? "default" : "secondary"} className="font-mono">
                    {rates.renta}{RATE_CONFIG.renta.unit}
                  </Badge>
                </div>
                <Slider
                  value={[rates.renta]}
                  onValueChange={(v) => handleRateChange('renta', v)}
                  min={RATE_CONFIG.renta.min}
                  max={RATE_CONFIG.renta.max}
                  step={RATE_CONFIG.renta.step}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{RATE_CONFIG.renta.min}%</span>
                  <span className="text-primary">Actual: {DEFAULT_RATES.renta}%</span>
                  <span>{RATE_CONFIG.renta.max}%</span>
                </div>
              </div>

              {/* IVA */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RATE_CONFIG.iva.color }}></span>
                    {RATE_CONFIG.iva.label}
                  </Label>
                  <Badge variant={rates.iva !== DEFAULT_RATES.iva ? "default" : "secondary"} className="font-mono">
                    {rates.iva}{RATE_CONFIG.iva.unit}
                  </Badge>
                </div>
                <Slider
                  value={[rates.iva]}
                  onValueChange={(v) => handleRateChange('iva', v)}
                  min={RATE_CONFIG.iva.min}
                  max={RATE_CONFIG.iva.max}
                  step={RATE_CONFIG.iva.step}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{RATE_CONFIG.iva.min}%</span>
                  <span className="text-primary">Actual: {DEFAULT_RATES.iva}%</span>
                  <span>{RATE_CONFIG.iva.max}%</span>
                </div>
              </div>

              {/* ICA */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RATE_CONFIG.ica.color }}></span>
                    {RATE_CONFIG.ica.label}
                  </Label>
                  <Badge variant={rates.ica !== DEFAULT_RATES.ica ? "default" : "secondary"} className="font-mono">
                    {rates.ica}{RATE_CONFIG.ica.unit}
                  </Badge>
                </div>
                <Slider
                  value={[rates.ica]}
                  onValueChange={(v) => handleRateChange('ica', v)}
                  min={RATE_CONFIG.ica.min}
                  max={RATE_CONFIG.ica.max}
                  step={RATE_CONFIG.ica.step}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{RATE_CONFIG.ica.min}‰</span>
                  <span className="text-primary">Actual: {DEFAULT_RATES.ica}‰</span>
                  <span>{RATE_CONFIG.ica.max}‰</span>
                </div>
              </div>

              {/* GMF */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RATE_CONFIG.gmf.color }}></span>
                    {RATE_CONFIG.gmf.label}
                  </Label>
                  <Badge variant={rates.gmf !== DEFAULT_RATES.gmf ? "default" : "secondary"} className="font-mono">
                    {rates.gmf === 0 ? 'Eliminado' : `${rates.gmf}${RATE_CONFIG.gmf.unit}`}
                  </Badge>
                </div>
                <Slider
                  value={[rates.gmf]}
                  onValueChange={(v) => handleRateChange('gmf', v)}
                  min={RATE_CONFIG.gmf.min}
                  max={RATE_CONFIG.gmf.max}
                  step={RATE_CONFIG.gmf.step}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0‰</span>
                  <span className="text-primary">Actual: {DEFAULT_RATES.gmf}‰</span>
                  <span>{RATE_CONFIG.gmf.max}‰</span>
                </div>
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <div className="flex items-center justify-between pt-2">
              <Label className="text-sm">Opciones Avanzadas</Label>
              <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
            </div>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="space-y-5 pt-2 border-t border-border">
                {/* Sobretasa */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RATE_CONFIG.sobretasa.color }}></span>
                      {RATE_CONFIG.sobretasa.label}
                    </Label>
                    <Badge variant={rates.sobretasa !== DEFAULT_RATES.sobretasa ? "default" : "secondary"} className="font-mono">
                      {rates.sobretasa}{RATE_CONFIG.sobretasa.unit}
                    </Badge>
                  </div>
                  <Slider
                    value={[rates.sobretasa]}
                    onValueChange={(v) => handleRateChange('sobretasa', v)}
                    min={RATE_CONFIG.sobretasa.min}
                    max={RATE_CONFIG.sobretasa.max}
                    step={RATE_CONFIG.sobretasa.step}
                    className="cursor-pointer"
                  />
                </div>

                {/* Pasarela */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RATE_CONFIG.pasarela.color }}></span>
                      {RATE_CONFIG.pasarela.label}
                    </Label>
                    <Badge variant={rates.pasarela !== DEFAULT_RATES.pasarela ? "default" : "secondary"} className="font-mono">
                      {rates.pasarela.toFixed(1)}{RATE_CONFIG.pasarela.unit}
                    </Badge>
                  </div>
                  <Slider
                    value={[rates.pasarela]}
                    onValueChange={(v) => handleRateChange('pasarela', v)}
                    min={RATE_CONFIG.pasarela.min}
                    max={RATE_CONFIG.pasarela.max}
                    step={RATE_CONFIG.pasarela.step}
                    className="cursor-pointer"
                  />
                </div>

                {/* Parafiscales */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RATE_CONFIG.parafiscales.color }}></span>
                      {RATE_CONFIG.parafiscales.label}
                    </Label>
                    <Badge variant={rates.parafiscales !== DEFAULT_RATES.parafiscales ? "default" : "secondary"} className="font-mono">
                      {rates.parafiscales}{RATE_CONFIG.parafiscales.unit}
                    </Badge>
                  </div>
                  <Slider
                    value={[rates.parafiscales]}
                    onValueChange={(v) => handleRateChange('parafiscales', v)}
                    min={RATE_CONFIG.parafiscales.min}
                    max={RATE_CONFIG.parafiscales.max}
                    step={RATE_CONFIG.parafiscales.step}
                    className="cursor-pointer"
                  />
                </div>

                {/* Mix Pago Digital */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm flex items-center gap-2">
                      <CreditCard className="h-3 w-3" />
                      Mix Pago Digital
                    </Label>
                    <Badge variant="secondary" className="font-mono">
                      {mixPagoDigital}%
                    </Badge>
                  </div>
                  <Slider
                    value={[mixPagoDigital]}
                    onValueChange={(v) => setMixPagoDigital(v[0])}
                    min={30}
                    max={100}
                    step={5}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg ${calculations.diferencia < 0 ? 'bg-success/10 border border-success/30' : calculations.diferencia > 0 ? 'bg-destructive/10 border border-destructive/30' : 'bg-muted/30'}`}>
                <p className="text-xs text-muted-foreground mb-1">Carga Total Simulada</p>
                <p className="text-xl font-bold">{formatCOP(calculations.granTotal)}</p>
              </div>
              <div className={`p-4 rounded-lg ${calculations.diferencia < 0 ? 'bg-success/10 border border-success/30' : calculations.diferencia > 0 ? 'bg-destructive/10 border border-destructive/30' : 'bg-muted/30'}`}>
                <p className="text-xs text-muted-foreground mb-1">Diferencia vs. Actual</p>
                <div className="flex items-center gap-1">
                  {calculations.diferencia < 0 ? (
                    <TrendingDown className="h-4 w-4 text-success" />
                  ) : calculations.diferencia > 0 ? (
                    <TrendingUp className="h-4 w-4 text-destructive" />
                  ) : null}
                  <p className={`text-xl font-bold ${calculations.diferencia < 0 ? 'text-success' : calculations.diferencia > 0 ? 'text-destructive' : ''}`}>
                    {calculations.diferencia >= 0 ? '+' : ''}{formatCOP(calculations.diferencia)}
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Variación %</p>
                <p className={`text-xl font-bold ${calculations.variacionPct < 0 ? 'text-success' : calculations.variacionPct > 0 ? 'text-destructive' : ''}`}>
                  {calculations.variacionPct >= 0 ? '+' : ''}{calculations.variacionPct.toFixed(2)}%
                </p>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-xs text-muted-foreground mb-1">Tasa Efectiva</p>
                <p className="text-xl font-bold text-primary">{calculations.tasaEfectiva.toFixed(2)}%</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pie Chart */}
              <div className="bg-muted/20 rounded-lg p-4">
                <p className="text-sm font-medium mb-3">Distribución de Carga</p>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCOP(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bar Comparison */}
              <div className="bg-muted/20 rounded-lg p-4">
                <p className="text-sm font-medium mb-3">Comparativo (COP Millones)</p>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        type="number" 
                        tickFormatter={(v) => `$${v.toLocaleString()}`}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toLocaleString()} M`, 'Carga']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Bar 
                        dataKey="valor" 
                        radius={[0, 4, 4, 0]}
                        fill={calculations.diferencia < 0 ? 'hsl(142, 71%, 45%)' : calculations.diferencia > 0 ? 'hsl(0, 84%, 60%)' : 'hsl(var(--primary))'}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="bg-muted/20 rounded-lg p-4">
              <p className="text-sm font-medium mb-3">Desglose Detallado</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="flex justify-between items-center p-2 bg-background rounded">
                  <span className="text-xs flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RATE_CONFIG.renta.color }}></span>
                    Renta
                  </span>
                  <span className="font-mono text-xs">{formatCOP(calculations.impuestoRenta)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-background rounded">
                  <span className="text-xs flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RATE_CONFIG.iva.color }}></span>
                    IVA
                  </span>
                  <span className="font-mono text-xs">{formatCOP(calculations.ivaDebito)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-background rounded">
                  <span className="text-xs flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RATE_CONFIG.ica.color }}></span>
                    ICA
                  </span>
                  <span className="font-mono text-xs">{formatCOP(calculations.icaBogota)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-background rounded">
                  <span className="text-xs flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RATE_CONFIG.gmf.color }}></span>
                    GMF
                  </span>
                  <span className="font-mono text-xs">{formatCOP(calculations.gmf)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-background rounded">
                  <span className="text-xs flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RATE_CONFIG.pasarela.color }}></span>
                    Pasarela
                  </span>
                  <span className="font-mono text-xs">{formatCOP(calculations.pasarelaComision)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-background rounded">
                  <span className="text-xs flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RATE_CONFIG.parafiscales.color }}></span>
                    Parafiscales
                  </span>
                  <span className="font-mono text-xs">{formatCOP(calculations.cargaParafiscal)}</span>
                </div>
              </div>
            </div>

            {/* Quick Scenarios */}
            <div className="flex flex-wrap gap-2">
              <p className="w-full text-sm font-medium mb-1">Escenarios Rápidos:</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setRates({ ...DEFAULT_RATES, renta: 30, sobretasa: 0 })}
                className="text-xs"
              >
                <Zap className="h-3 w-3 mr-1" />
                Pro-Inversión
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setRates({ ...DEFAULT_RATES, gmf: 0, iva: 20 })}
                className="text-xs"
              >
                <Building className="h-3 w-3 mr-1" />
                Sin GMF
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setRates({ ...DEFAULT_RATES, renta: 40, iva: 21, sobretasa: 5 })}
                className="text-xs"
              >
                <Percent className="h-3 w-3 mr-1" />
                Recaudatorio
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setRates({ ...DEFAULT_RATES, renta: 33, gmf: 3 })}
                className="text-xs"
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Equilibrado
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}