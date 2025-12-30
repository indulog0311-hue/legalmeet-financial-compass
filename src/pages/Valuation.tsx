/**
 * VALUATION & CAP TABLE
 * DCF Simplificado + Simulador de Ronda de Inversión
 * Herramienta para negociación con VCs
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCOP } from '@/lib/formatters';
import { 
  Calculator, TrendingUp, PieChart, Users, 
  DollarSign, Percent, Building, ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts';
import {
  getNominaTotalCalculado,
  getOPEXFijoMensual,
  INGRESOS_CATALOG,
  RETEFUENTE_ABOGADOS,
  GMF_RATE,
  TASA_RENTA
} from '@/lib/constants/catalogoMaestro';

// ============ PARÁMETROS DEFAULT ============
const DEFAULT_PARAMS = {
  wacc: 0.15, // 15% tasa de descuento
  terminalGrowth: 0.03, // 3% crecimiento perpetuo
  capitalInicial: 500000000,
  volumenInicial: 100,
  crecimientoAño1: 0.10,
  crecimientoAño2_5: 0.05
};

// ============ TIPOS ============
interface FlujoCajaAnual {
  año: number;
  ingresos: number;
  costos: number;
  opex: number;
  ebitda: number;
  impuestos: number;
  flujoCajaLibre: number;
  factorDescuento: number;
  valorPresente: number;
}

interface Valoracion {
  flujosDescontados: number;
  valorTerminal: number;
  valorTerminalDescontado: number;
  enterpriseValue: number;
  equityValue: number;
}

interface CapTableEntry {
  nombre: string;
  acciones: number;
  porcentaje: number;
  valorImplicito: number;
  tipo: 'fundador' | 'inversor' | 'pool';
}

// ============ GENERACIÓN DE FLUJOS ============
function generarFlujosCaja(params: typeof DEFAULT_PARAMS): FlujoCajaAnual[] {
  const flujos: FlujoCajaAnual[] = [];
  
  for (let año = 2026; año <= 2031; año++) {
    const añoIndex = año - 2026;
    const mesesTranscurridos = añoIndex * 12;
    
    // Calcular volumen anual
    let volumenAnual = 0;
    for (let mes = 1; mes <= 12; mes++) {
      const mesGlobal = mesesTranscurridos + mes;
      const tasaCrecimiento = año === 2026 ? params.crecimientoAño1 : params.crecimientoAño2_5;
      const volumenMes = Math.round(
        params.volumenInicial * Math.pow(1 + tasaCrecimiento, mesGlobal - 1)
      );
      volumenAnual += volumenMes;
    }
    
    // Ingresos (precio promedio ponderado ~$100,000)
    const precioPromedio = 100000;
    const ingresos = volumenAnual * precioPromedio;
    
    // Costos directos (~65% de ingresos en marketplace)
    const costos = ingresos * 0.65;
    
    // OPEX (crece con inflación 5.5%)
    const opexBase = getOPEXFijoMensual() * 12;
    const opex = opexBase * Math.pow(1.055, añoIndex);
    
    // EBITDA
    const ebitda = ingresos - costos - opex;
    
    // Impuestos (solo si EBITDA positivo)
    const impuestos = ebitda > 0 ? ebitda * TASA_RENTA : 0;
    
    // Flujo de Caja Libre (FCL)
    const flujoCajaLibre = ebitda - impuestos;
    
    // Factor de descuento
    const factorDescuento = Math.pow(1 + params.wacc, añoIndex + 1);
    
    // Valor presente
    const valorPresente = flujoCajaLibre / factorDescuento;
    
    flujos.push({
      año,
      ingresos: Math.round(ingresos),
      costos: Math.round(costos),
      opex: Math.round(opex),
      ebitda: Math.round(ebitda),
      impuestos: Math.round(impuestos),
      flujoCajaLibre: Math.round(flujoCajaLibre),
      factorDescuento,
      valorPresente: Math.round(valorPresente)
    });
  }
  
  return flujos;
}

// ============ CÁLCULO DCF ============
function calcularDCF(
  flujos: FlujoCajaAnual[],
  wacc: number,
  terminalGrowth: number
): Valoracion {
  // Suma de flujos descontados
  const flujosDescontados = flujos.reduce((sum, f) => sum + f.valorPresente, 0);
  
  // Valor terminal (Gordon Growth Model)
  const ultimoFCL = flujos[flujos.length - 1].flujoCajaLibre;
  const valorTerminal = (ultimoFCL * (1 + terminalGrowth)) / (wacc - terminalGrowth);
  
  // Descontar valor terminal
  const añosHastaTerminal = flujos.length;
  const valorTerminalDescontado = valorTerminal / Math.pow(1 + wacc, añosHastaTerminal);
  
  // Enterprise Value
  const enterpriseValue = flujosDescontados + valorTerminalDescontado;
  
  // Equity Value (asumiendo deuda cero)
  const equityValue = enterpriseValue;
  
  return {
    flujosDescontados: Math.round(flujosDescontados),
    valorTerminal: Math.round(valorTerminal),
    valorTerminalDescontado: Math.round(valorTerminalDescontado),
    enterpriseValue: Math.round(enterpriseValue),
    equityValue: Math.round(equityValue)
  };
}

// ============ SIMULADOR CAP TABLE ============
function simularRonda(
  valoracionPreMoney: number,
  montoLevantar: number,
  fundadores: number = 80,
  esop: number = 10,
  angelsPrevios: number = 10
): CapTableEntry[] {
  const valoracionPostMoney = valoracionPreMoney + montoLevantar;
  const dilucion = (montoLevantar / valoracionPostMoney) * 100;
  
  // Calcular nuevos porcentajes
  const factorDilucion = 1 - (montoLevantar / valoracionPostMoney);
  
  const fundadoresNuevo = fundadores * factorDilucion;
  const esopNuevo = esop * factorDilucion;
  const angelsNuevo = angelsPrevios * factorDilucion;
  const nuevoInversor = dilucion;
  
  const totalAcciones = 10000000; // 10M acciones base
  
  return [
    {
      nombre: 'Fundadores',
      acciones: Math.round(totalAcciones * fundadoresNuevo / 100),
      porcentaje: fundadoresNuevo,
      valorImplicito: Math.round(valoracionPostMoney * fundadoresNuevo / 100),
      tipo: 'fundador'
    },
    {
      nombre: 'ESOP (Pool)',
      acciones: Math.round(totalAcciones * esopNuevo / 100),
      porcentaje: esopNuevo,
      valorImplicito: Math.round(valoracionPostMoney * esopNuevo / 100),
      tipo: 'pool'
    },
    {
      nombre: 'Angels (Previos)',
      acciones: Math.round(totalAcciones * angelsNuevo / 100),
      porcentaje: angelsNuevo,
      valorImplicito: Math.round(valoracionPostMoney * angelsNuevo / 100),
      tipo: 'inversor'
    },
    {
      nombre: 'Nuevo Inversor (Ronda)',
      acciones: Math.round(totalAcciones * nuevoInversor / 100),
      porcentaje: nuevoInversor,
      valorImplicito: montoLevantar,
      tipo: 'inversor'
    }
  ];
}

const COLORS = ['hsl(var(--accent))', 'hsl(45, 100%, 50%)', 'hsl(var(--muted))', 'hsl(280, 100%, 60%)'];

export default function Valuation() {
  const [wacc, setWacc] = useState(DEFAULT_PARAMS.wacc * 100);
  const [terminalGrowth, setTerminalGrowth] = useState(DEFAULT_PARAMS.terminalGrowth * 100);
  const [montoLevantar, setMontoLevantar] = useState(500000000);
  const [valoracionPreMoney, setValoracionPreMoney] = useState(2000000000);
  
  // Generar flujos y valoración
  const flujos = useMemo(() => generarFlujosCaja(DEFAULT_PARAMS), []);
  
  const valoracion = useMemo(() => {
    return calcularDCF(flujos, wacc / 100, terminalGrowth / 100);
  }, [flujos, wacc, terminalGrowth]);
  
  // Cap Table
  const capTable = useMemo(() => {
    return simularRonda(valoracionPreMoney, montoLevantar);
  }, [valoracionPreMoney, montoLevantar]);
  
  const dilucion = (montoLevantar / (valoracionPreMoney + montoLevantar)) * 100;
  const valoracionPostMoney = valoracionPreMoney + montoLevantar;
  
  // Datos para gráfico de flujos
  const dataFlujos = flujos.map(f => ({
    año: f.año.toString(),
    fcl: f.flujoCajaLibre,
    vp: f.valorPresente
  }));
  
  // Datos para pie chart
  const dataPie = capTable.map(entry => ({
    name: entry.nombre,
    value: entry.porcentaje
  }));
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Valuation & Cap Table</h1>
          <p className="text-muted-foreground mt-1">
            DCF Simplificado y Simulador de Ronda de Inversión
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          EV: {formatCOP(valoracion.enterpriseValue)}
        </Badge>
      </div>
      
      {/* Parámetros DCF */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Parámetros de Valoración (DCF)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>WACC (Tasa de Descuento): {wacc.toFixed(1)}%</Label>
              <Slider
                value={[wacc]}
                onValueChange={([v]) => setWacc(v)}
                min={8}
                max={30}
                step={0.5}
              />
              <p className="text-xs text-muted-foreground">
                Startups LatAm: 15-25%
              </p>
            </div>
            <div className="space-y-2">
              <Label>Crecimiento Terminal: {terminalGrowth.toFixed(1)}%</Label>
              <Slider
                value={[terminalGrowth]}
                onValueChange={([v]) => setTerminalGrowth(v)}
                min={1}
                max={5}
                step={0.5}
              />
              <p className="text-xs text-muted-foreground">
                Típico: 2-4% (cercano a inflación largo plazo)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Resultados DCF */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">VP Flujos Operativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCOP(valoracion.flujosDescontados)}</div>
            <p className="text-xs text-muted-foreground">2026-2031</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Terminal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCOP(valoracion.valorTerminalDescontado)}</div>
            <p className="text-xs text-muted-foreground">Perpetuidad descontada</p>
          </CardContent>
        </Card>
        
        <Card className="border-accent/50 bg-accent/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building className="h-4 w-4" />
              Enterprise Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-accent">{formatCOP(valoracion.enterpriseValue)}</div>
            <p className="text-xs text-muted-foreground">Valor total empresa</p>
          </CardContent>
        </Card>
        
        <Card className="border-green-500/50 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Equity Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">{formatCOP(valoracion.equityValue)}</div>
            <p className="text-xs text-muted-foreground">Valor patrimonio (0 deuda)</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabla de Flujos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Proyección de Flujo de Caja Libre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Año</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                  <TableHead className="text-right">Costos</TableHead>
                  <TableHead className="text-right">OPEX</TableHead>
                  <TableHead className="text-right">EBITDA</TableHead>
                  <TableHead className="text-right">Impuestos</TableHead>
                  <TableHead className="text-right">FCL</TableHead>
                  <TableHead className="text-right">Factor Desc.</TableHead>
                  <TableHead className="text-right font-bold">VP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flujos.map((f) => (
                  <TableRow key={f.año}>
                    <TableCell className="font-medium">{f.año}</TableCell>
                    <TableCell className="text-right font-mono text-green-600">
                      {(f.ingresos / 1000000).toFixed(0)}M
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-500">
                      {(f.costos / 1000000).toFixed(0)}M
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {(f.opex / 1000000).toFixed(0)}M
                    </TableCell>
                    <TableCell className={`text-right font-mono ${f.ebitda >= 0 ? '' : 'text-red-500'}`}>
                      {(f.ebitda / 1000000).toFixed(0)}M
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {(f.impuestos / 1000000).toFixed(0)}M
                    </TableCell>
                    <TableCell className={`text-right font-mono ${f.flujoCajaLibre >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {(f.flujoCajaLibre / 1000000).toFixed(0)}M
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {f.factorDescuento.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-accent">
                      {(f.valorPresente / 1000000).toFixed(0)}M
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Gráfico de Flujos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">FCL vs Valor Presente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataFlujos}>
                <defs>
                  <linearGradient id="fclGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="año" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatCOP(value), 
                    name === 'fcl' ? 'FCL' : 'Valor Presente'
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area type="monotone" dataKey="fcl" stroke="hsl(var(--accent))" fill="url(#fclGradient)" />
                <Area type="monotone" dataKey="vp" stroke="hsl(var(--primary))" fill="none" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Separator />
      
      {/* Simulador de Ronda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Simulador de Ronda de Inversión
          </CardTitle>
          <CardDescription>
            Calcula dilución y estructura de cap table post-ronda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="space-y-2">
              <Label>Valoración Pre-Money</Label>
              <Input
                type="number"
                value={valoracionPreMoney}
                onChange={(e) => setValoracionPreMoney(parseInt(e.target.value) || 0)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                {formatCOP(valoracionPreMoney)}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Monto a Levantar</Label>
              <Input
                type="number"
                value={montoLevantar}
                onChange={(e) => setMontoLevantar(parseInt(e.target.value) || 0)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                {formatCOP(montoLevantar)}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Resultado</Label>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Post-Money:</span>
                  <span className="font-bold">{formatCOP(valoracionPostMoney)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-muted-foreground">Dilución:</span>
                  <span className="font-bold text-destructive">{dilucion.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tabla Cap Table */}
            <div>
              <h4 className="font-semibold mb-3">Cap Table Post-Ronda</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Accionista</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">Valor Implícito</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {capTable.map((entry, idx) => (
                    <TableRow key={entry.nombre}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[idx] }}
                          />
                          {entry.nombre}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.porcentaje.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCOP(entry.valorImplicito)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pie Chart */}
            <div>
              <h4 className="font-semibold mb-3">Distribución Accionaria</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={dataPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value.toFixed(0)}%`}
                      labelLine={false}
                    >
                      {dataPie.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Escenarios Rápidos */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Escenarios de Valoración</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              className="p-4 border rounded-lg cursor-pointer hover:border-accent transition-colors"
              onClick={() => {
                setValoracionPreMoney(1000000000);
                setMontoLevantar(300000000);
              }}
            >
              <p className="font-semibold">Seed Round</p>
              <p className="text-sm text-muted-foreground">$1B Pre / $300M Raise</p>
              <Badge variant="outline" className="mt-2">23% Dilución</Badge>
            </div>
            <div 
              className="p-4 border rounded-lg cursor-pointer hover:border-accent transition-colors"
              onClick={() => {
                setValoracionPreMoney(3000000000);
                setMontoLevantar(1000000000);
              }}
            >
              <p className="font-semibold">Series A</p>
              <p className="text-sm text-muted-foreground">$3B Pre / $1B Raise</p>
              <Badge variant="outline" className="mt-2">25% Dilución</Badge>
            </div>
            <div 
              className="p-4 border rounded-lg cursor-pointer hover:border-accent transition-colors"
              onClick={() => {
                setValoracionPreMoney(10000000000);
                setMontoLevantar(3000000000);
              }}
            >
              <p className="font-semibold">Series B</p>
              <p className="text-sm text-muted-foreground">$10B Pre / $3B Raise</p>
              <Badge variant="outline" className="mt-2">23% Dilución</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
