import { useSimuladorStore } from '@/store/simuladorStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, FileText, DollarSign, Percent, Check, X, TrendingUp, Building2, Receipt } from 'lucide-react';
import { formatCOP, formatPercent } from '@/lib/formatters';
import { CatalogoItem } from '@/types/catalogo';

export function Catalogo() {
  const { 
    catalogoIngresos, 
    catalogoCostos, 
    catalogoOPEX, 
    catalogoImpuestos 
  } = useSimuladorStore();
  
  const catalogoCompleto = [...catalogoIngresos, ...catalogoCostos, ...catalogoOPEX, ...catalogoImpuestos];
  
  const stats = {
    total: catalogoCompleto.length,
    ingresos: catalogoIngresos.length,
    costos: catalogoCostos.length,
    opex: catalogoOPEX.length,
    impuestos: catalogoImpuestos.length,
    precioPromedioIngresos: catalogoIngresos.reduce((sum, s) => sum + s.valorUnitario, 0) / catalogoIngresos.length,
    opexMensual: catalogoOPEX.reduce((sum, g) => sum + g.valorUnitario, 0),
    nominaMensual: catalogoOPEX.filter(g => g.esNomina).reduce((sum, g) => sum + g.valorUnitario, 0),
  };

  const tipoColors: Record<string, string> = {
    'ingreso': 'bg-green-500/20 text-green-400 border-green-500/30',
    'costo_variable': 'bg-red-500/20 text-red-400 border-red-500/30',
    'gasto': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'impuesto': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'capex': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  const renderTable = (items: CatalogoItem[], showVinculado: boolean = false) => (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Código</TableHead>
            <TableHead>Concepto</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Frecuencia</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Categoría</TableHead>
            {showVinculado && <TableHead>Vinculado a</TableHead>}
            <TableHead className="text-center">Activo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.codigo}>
              <TableCell className="font-mono text-xs font-medium">{item.codigo}</TableCell>
              <TableCell className="font-medium">{item.concepto}</TableCell>
              <TableCell className="text-right font-mono">
                {item.esPorcentaje 
                  ? `${(item.valorUnitario * 100).toFixed(2)}%`
                  : formatCOP(item.valorUnitario)
                }
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">{item.frecuencia}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-32 truncate">
                {item.driver}
              </TableCell>
              <TableCell>
                <Badge className={tipoColors[item.tipo] || 'bg-muted'}>
                  {item.subCategoria || item.categoria}
                </Badge>
              </TableCell>
              {showVinculado && (
                <TableCell className="font-mono text-xs">
                  {item.vinculadoA || '—'}
                </TableCell>
              )}
              <TableCell className="text-center">
                {item.activo ? (
                  <Check className="h-4 w-4 text-green-500 mx-auto" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground mx-auto" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.ingresos}</p>
                <p className="text-xs text-muted-foreground">SKUs Ingresos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCOP(stats.nominaMensual)}</p>
                <p className="text-xs text-muted-foreground">Nómina Mensual</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Receipt className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCOP(stats.opexMensual)}</p>
                <p className="text-xs text-muted-foreground">OPEX Mensual Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification Badge */}
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            <span className="font-medium">Store Unificado: OK</span>
            <Badge variant="outline" className="ml-2">
              Catálogo V5.0 - {catalogoCompleto.length} items
            </Badge>
            <Badge variant="outline" className={stats.nominaMensual >= 30000000 ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}>
              Nómina Completa (Total &gt; $30M): {stats.nominaMensual >= 30000000 ? 'OK' : 'PENDIENTE'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabs por Tipo */}
      <Tabs defaultValue="ingresos" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="ingresos" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Ingresos ({stats.ingresos})
          </TabsTrigger>
          <TabsTrigger value="costos" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Costos ({stats.costos})
          </TabsTrigger>
          <TabsTrigger value="opex" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            OPEX ({stats.opex})
          </TabsTrigger>
          <TabsTrigger value="impuestos" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Impuestos ({stats.impuestos})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ingresos">
          <Card>
            <CardHeader>
              <CardTitle>Catálogo de Ingresos (SKUs)</CardTitle>
              <CardDescription>
                Productos y servicios con sus configuraciones de precios e IVA.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTable(catalogoIngresos)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costos">
          <Card>
            <CardHeader>
              <CardTitle>Costos Directos (Variables)</CardTitle>
              <CardDescription>
                Costos de venta vinculados a cada transacción.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTable(catalogoCostos, true)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opex">
          <Card>
            <CardHeader>
              <CardTitle>Gastos Operativos (OPEX)</CardTitle>
              <CardDescription>
                Nómina, herramientas y gastos administrativos fijos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTable(catalogoOPEX)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impuestos">
          <Card>
            <CardHeader>
              <CardTitle>Impuestos y Obligaciones Fiscales</CardTitle>
              <CardDescription>
                Renta, ICA, GMF y otras obligaciones tributarias colombianas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTable(catalogoImpuestos)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge className={tipoColors['ingreso']}>Ingreso</Badge>
              <span className="text-xs text-muted-foreground">Ventas</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={tipoColors['costo_variable']}>Costo</Badge>
              <span className="text-xs text-muted-foreground">Variable por Tx</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={tipoColors['gasto']}>Gasto</Badge>
              <span className="text-xs text-muted-foreground">OPEX Fijo</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={tipoColors['impuesto']}>Impuesto</Badge>
              <span className="text-xs text-muted-foreground">Obligación Fiscal</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={tipoColors['capex']}>CAPEX</Badge>
              <span className="text-xs text-muted-foreground">Inversión</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
