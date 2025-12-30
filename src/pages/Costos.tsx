import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  INGRESOS_CATALOG, 
  COSTOS_DIRECTOS_CATALOG, 
  GASTOS_OPEX_CATALOG, 
  IMPUESTOS_CATALOG,
  getNominaTotal,
  TASA_RENTA,
  TASA_ICA_BOGOTA,
  TASA_IVA,
  GMF_RATE
} from '@/lib/constants/catalogoMaestro';
import { useSimuladorStore } from '@/store/simuladorStore';
import { formatCOP, formatPercent } from '@/lib/formatters';
import { DollarSign, Receipt, Building2, Calculator, TrendingUp, AlertTriangle, Users, Percent } from 'lucide-react';

export function Costos() {
  const [activeTab, setActiveTab] = useState('ingresos');
  const { config } = useSimuladorStore();
  
  const nominaTotal = getNominaTotal();
  
  const stats = {
    ingresos: INGRESOS_CATALOG.length,
    costosDirectos: COSTOS_DIRECTOS_CATALOG.length,
    opex: GASTOS_OPEX_CATALOG.length,
    impuestos: IMPUESTOS_CATALOG.length
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catálogo Maestro V4.0</h1>
          <p className="text-muted-foreground mt-1">Fuente de Verdad - Sistema Operativo Financiero LegalMeet</p>
        </div>
        <Badge variant="outline" className="text-xs">
          Colombia {config.añoInicio}-{config.añoFin}
        </Badge>
      </div>

      {/* KPIs del Catálogo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="finance-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">SKUs Ingresos</p>
                <p className="text-xl font-bold">{stats.ingresos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="finance-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Receipt className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Costos Directos</p>
                <p className="text-xl font-bold">{stats.costosDirectos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="finance-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">OPEX Mensual</p>
                <p className="text-lg font-bold">{formatCOP(nominaTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="finance-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Calculator className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Impuestos</p>
                <p className="text-xl font-bold">{stats.impuestos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasas Fiscales Activas */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Tasas Fiscales Colombia 2026
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Renta:</span>
              <span className="ml-2 font-mono font-bold">{formatPercent(TASA_RENTA)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">IVA:</span>
              <span className="ml-2 font-mono font-bold">{formatPercent(TASA_IVA)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">ICA Bogotá:</span>
              <span className="ml-2 font-mono font-bold">{formatPercent(TASA_ICA_BOGOTA)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">GMF:</span>
              <span className="ml-2 font-mono font-bold">{formatPercent(GMF_RATE)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs del Catálogo */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="ingresos" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            Ingresos ({stats.ingresos})
          </TabsTrigger>
          <TabsTrigger value="costos" className="text-xs">
            <Receipt className="h-3 w-3 mr-1" />
            Costos ({stats.costosDirectos})
          </TabsTrigger>
          <TabsTrigger value="opex" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            OPEX ({stats.opex})
          </TabsTrigger>
          <TabsTrigger value="impuestos" className="text-xs">
            <Calculator className="h-3 w-3 mr-1" />
            Fiscal ({stats.impuestos})
          </TabsTrigger>
        </TabsList>

        {/* Tab Ingresos */}
        <TabsContent value="ingresos">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                Catálogo de Ingresos (Revenue)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Código</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Sub-Cat</TableHead>
                      <TableHead className="text-right">Valor Base</TableHead>
                      <TableHead>IVA</TableHead>
                      <TableHead>PUC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {INGRESOS_CATALOG.map(item => (
                      <TableRow key={item.codigo}>
                        <TableCell className="font-mono text-xs">{item.codigo}</TableCell>
                        <TableCell className="font-medium">{item.concepto}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{item.subCategoria}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatCOP(item.valorUnitario)}</TableCell>
                        <TableCell>
                          {item.gravaIVA ? (
                            <Badge className="bg-amber-500/20 text-amber-600 text-xs">19%</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Exento</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{item.cuentaPUC}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Costos Directos */}
        <TabsContent value="costos">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5 text-red-500" />
                Costos Directos (Unit Economics)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Código</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Sub-Cat</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Regla</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {COSTOS_DIRECTOS_CATALOG.map(item => (
                      <TableRow key={item.codigo}>
                        <TableCell className="font-mono text-xs">{item.codigo}</TableCell>
                        <TableCell className="font-medium">
                          {item.concepto}
                          {item.esCostoOculto && (
                            <AlertTriangle className="inline h-3 w-3 ml-1 text-amber-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.subCategoria === 'Escrow' ? 'default' : 'secondary'} className="text-xs">
                            {item.subCategoria}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {item.esPorcentaje ? formatPercent(item.valorUnitario) : formatCOP(item.valorUnitario)}
                        </TableCell>
                        <TableCell className="text-xs">{item.driver}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={item.observacion}>
                          {item.observacion}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab OPEX */}
        <TabsContent value="opex">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                Gastos Operacionales (OPEX)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Código</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Valor Mensual</TableHead>
                      <TableHead>Frecuencia</TableHead>
                      <TableHead>PUC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {GASTOS_OPEX_CATALOG.map(item => (
                      <TableRow key={item.codigo}>
                        <TableCell className="font-mono text-xs">{item.codigo}</TableCell>
                        <TableCell className="font-medium">{item.concepto}</TableCell>
                        <TableCell>
                          <Badge variant={item.esNomina ? 'default' : 'secondary'} className="text-xs">
                            {item.subCategoria}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatCOP(item.valorUnitario)}</TableCell>
                        <TableCell className="text-xs">{item.frecuencia}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{item.cuentaPUC}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Impuestos */}
        <TabsContent value="impuestos">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5 text-amber-500" />
                Estructura Tributaria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Código</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Base</TableHead>
                      <TableHead className="text-right">Tasa</TableHead>
                      <TableHead>Frecuencia</TableHead>
                      <TableHead>PUC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {IMPUESTOS_CATALOG.map(item => (
                      <TableRow key={item.codigo}>
                        <TableCell className="font-mono text-xs">{item.codigo}</TableCell>
                        <TableCell className="font-medium">{item.concepto}</TableCell>
                        <TableCell className="text-xs">{item.driver}</TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {formatPercent(item.valorUnitario)}
                        </TableCell>
                        <TableCell className="text-xs">{item.frecuencia}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{item.cuentaPUC}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
