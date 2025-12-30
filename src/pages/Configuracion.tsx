import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormattedNumberInput } from '@/components/inputs/FormattedNumberInput';
import { DecimalPercentInput } from '@/components/inputs/DecimalPercentInput';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSimuladorStore } from '@/store/simuladorStore';
import { formatCOP, formatPercent, formatServicios } from '@/lib/formatters';
import { toast } from 'sonner';
import { 
  Upload, Play, RotateCcw, Settings2, TrendingUp, 
  DollarSign, FileSpreadsheet, CheckCircle2, AlertCircle,
  Edit3, Save, X, Trash2, RefreshCw, Percent
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConfigValidation, ValidationBadge } from '@/components/validation/ConfigValidation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function Configuracion() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('parametros');
  const [añoSeleccionado, setAñoSeleccionado] = useState(2026);
  const [editandoItem, setEditandoItem] = useState<string | null>(null);
  const [valoresEditados, setValoresEditados] = useState<Record<string, number>>({});
  
  const {
    catalogoIngresos,
    parametrosMacro,
    config,
    configVolumenes,
    volumenes,
    preciosPersonalizados,
    simulacionActiva,
    ultimaActualizacion,
    cargarCatalogoDesdeCSV,
    actualizarParametroMacro,
    actualizarConfig,
    actualizarVolumen,
    actualizarPrecio,
    actualizarTasaCrecimientoSKU,
    actualizarConfigVolumenes,
    regenerarVolumenes,
    resetearCatalogo,
    limpiarTodo,
    iniciarSimulacion,
    getTasaCrecimientoSKU
  } = useSimuladorStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      const resultado = cargarCatalogoDesdeCSV(csv);
      
      if (resultado.success) {
        toast.success('Catálogo cargado exitosamente', {
          description: resultado.errores.length > 0 
            ? `${resultado.errores.length} advertencias` 
            : 'Todos los items procesados correctamente'
        });
      } else {
        toast.error('Error al cargar catálogo', {
          description: resultado.errores[0]
        });
      }
    };
    reader.readAsText(file);
  };

  const handleIniciarSimulacion = () => {
    iniciarSimulacion();
    toast.success('Simulación iniciada', {
      description: `Periodo ${config.añoInicio} - ${config.añoFin}`
    });
    navigate('/estados-financieros');
  };

  const handleLimpiarTodo = () => {
    limpiarTodo();
    toast.success('Sistema limpiado', {
      description: 'Cache, datos y configuración eliminados. Plataforma lista para nueva simulación.'
    });
  };

  const handleGuardarPrecio = (codigo: string) => {
    if (valoresEditados[codigo] !== undefined) {
      actualizarPrecio(codigo, valoresEditados[codigo]);
      toast.success(`Precio de ${codigo} actualizado`);
    }
    setEditandoItem(null);
    setValoresEditados({});
  };

  const volumenesAño = volumenes[añoSeleccionado] || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header con botones principales */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración de Simulación</h1>
          <p className="text-muted-foreground mt-1">Configure los parámetros antes de generar proyecciones financieras</p>
        </div>
        <div className="flex gap-2">
          {/* Botón Limpiar Todo */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Limpiar Todo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Limpiar todos los datos?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Cache del navegador</li>
                    <li>Catálogo personalizado</li>
                    <li>Precios modificados</li>
                    <li>Volúmenes configurados</li>
                    <li>Parámetros macro editados</li>
                  </ul>
                  <p className="mt-2 font-semibold">La plataforma se reiniciará con los valores por defecto.</p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleLimpiarTodo} className="bg-destructive text-destructive-foreground">
                  Sí, limpiar todo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {/* Botón Resetear */}
          <Button variant="outline" size="sm" onClick={resetearCatalogo}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetear
          </Button>
          
          {/* Botón Iniciar Simulación */}
          <Button onClick={handleIniciarSimulacion} className="bg-emerald-600 hover:bg-emerald-700">
            <Play className="h-4 w-4 mr-2" />
            Iniciar Simulación
          </Button>
        </div>
      </div>

      {/* Estado de la simulación */}
      <Card className={simulacionActiva ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-amber-500/50 bg-amber-500/5'}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {simulacionActiva ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              )}
              <div>
                <p className="font-medium">
                  {simulacionActiva ? 'Simulación Activa' : 'Configure los parámetros para iniciar'}
                </p>
                {ultimaActualizacion && (
                  <p className="text-xs text-muted-foreground">
                    Última actualización: {new Date(ultimaActualizacion).toLocaleString('es-CO')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Inicio: 5 tx/SKU
              </Badge>
              <Badge variant="outline">
                Crecimiento: {formatPercent(configVolumenes.tasaCrecimientoDefault)} mensual
              </Badge>
              <Badge variant={simulacionActiva ? 'default' : 'secondary'}>
                {config.añoInicio} - {config.añoFin}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validación de configuración */}
      <ConfigValidation />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="parametros">
            <Settings2 className="h-4 w-4 mr-2" />
            Parámetros
          </TabsTrigger>
          <TabsTrigger value="crecimiento">
            <Percent className="h-4 w-4 mr-2" />
            Crecimiento
          </TabsTrigger>
          <TabsTrigger value="precios">
            <DollarSign className="h-4 w-4 mr-2" />
            Precios
          </TabsTrigger>
          <TabsTrigger value="volumenes">
            <TrendingUp className="h-4 w-4 mr-2" />
            Volúmenes
          </TabsTrigger>
          <TabsTrigger value="catalogo">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            CSV
          </TabsTrigger>
        </TabsList>

        {/* Tab Parámetros Macro */}
        <TabsContent value="parametros" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Configuración General */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuración General</CardTitle>
                <CardDescription>Parámetros base del modelo financiero</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Año Inicio</Label>
                    <Select 
                      value={config.añoInicio.toString()} 
                      onValueChange={(v) => {
                        const nuevoInicio = parseInt(v);
                        // Si el año fin es menor o igual al nuevo inicio, ajustarlo
                        if (config.añoFin <= nuevoInicio) {
                          actualizarConfig({ añoInicio: nuevoInicio, añoFin: nuevoInicio + 1 });
                        } else {
                          actualizarConfig({ añoInicio: nuevoInicio });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2026, 2027, 2028, 2029, 2030].map(año => (
                          <SelectItem key={año} value={año.toString()}>{año}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Año Fin</Label>
                    <Select 
                      value={config.añoFin.toString()} 
                      onValueChange={(v) => actualizarConfig({ añoFin: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2027, 2028, 2029, 2030, 2031].filter(año => año > config.añoInicio).map(año => (
                          <SelectItem key={año} value={año.toString()}>{año}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label>Capital Inicial (COP)</Label>
                  <FormattedNumberInput
                    value={config.capitalInicial}
                    onValueChange={(v) => actualizarConfig({ capitalInicial: v })}
                    className="font-mono"
                  />
                </div>
                
                <div>
                  <Label>Mix Pago Digital (%)</Label>
                  <Input 
                    type="number"
                    value={config.mixPagoDigital * 100}
                    onChange={(e) => actualizarConfig({ mixPagoDigital: (parseFloat(e.target.value) || 0) / 100 })}
                    className="font-mono"
                  />
                </div>
                
                <div>
                  <Label>Tasa Churn Mensual (%)</Label>
                  <Input 
                    type="number"
                    value={config.tasaChurnMensual * 100}
                    onChange={(e) => actualizarConfig({ tasaChurnMensual: (parseFloat(e.target.value) || 0) / 100 })}
                    className="font-mono"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Parámetros por Año */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Parámetros Macroeconómicos por Año</CardTitle>
                <CardDescription>IVA, Inflación, TRM y tasas fiscales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Año</TableHead>
                        <TableHead>Inflación %</TableHead>
                        <TableHead>IVA %</TableHead>
                        <TableHead>Renta %</TableHead>
                        <TableHead>TRM</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parametrosMacro.map(params => (
                        <TableRow key={params.año}>
                          <TableCell className="font-bold">{params.año}</TableCell>
                          <TableCell>
                            <DecimalPercentInput
                              value={params.inflacionPct}
                              onValueChange={(v) => actualizarParametroMacro(params.año, { inflacionPct: v })}
                              min={0}
                              max={50}
                              className="w-16 h-8 text-xs font-mono"
                            />
                          </TableCell>
                          <TableCell>
                            <DecimalPercentInput
                              value={params.tasaIVAPct}
                              onValueChange={(v) => actualizarParametroMacro(params.año, { tasaIVAPct: v })}
                              min={0}
                              max={100}
                              className="w-16 h-8 text-xs font-mono"
                            />
                          </TableCell>
                          <TableCell>
                            <DecimalPercentInput
                              value={params.tasaRentaPct}
                              onValueChange={(v) => actualizarParametroMacro(params.año, { tasaRentaPct: v })}
                              min={0}
                              max={100}
                              className="w-16 h-8 text-xs font-mono"
                            />
                          </TableCell>
                          <TableCell>
                            <FormattedNumberInput
                              value={params.trm}
                              onValueChange={(v) => actualizarParametroMacro(params.año, { trm: v })}
                              className="w-20 h-8 text-xs font-mono"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Crecimiento por SKU */}
        <TabsContent value="crecimiento">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    Tasas de Crecimiento por SKU
                  </CardTitle>
                  <CardDescription>
                    Configure el % de crecimiento mensual para cada producto. Los volúmenes inician en {configVolumenes.volumenInicialPorSKU} transacciones.
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={regenerarVolumenes}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerar Volúmenes
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Configuración global */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label>Volumen Inicial por SKU</Label>
                  <Input
                    type="number"
                    value={configVolumenes.volumenInicialPorSKU}
                    onChange={(e) => actualizarConfigVolumenes({ 
                      volumenInicialPorSKU: parseInt(e.target.value) || 5 
                    })}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Transacciones iniciales en mes 1</p>
                </div>
                <div>
                  <Label>Tasa Crecimiento Default (%)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={configVolumenes.tasaCrecimientoDefault * 100}
                    onChange={(e) => actualizarConfigVolumenes({ 
                      tasaCrecimientoDefault: (parseFloat(e.target.value) || 6) / 100 
                    })}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Aplica si no se especifica por SKU</p>
                </div>
              </div>

              {/* Tabla de tasas por SKU */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Código</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Categoría</TableHead>
                    <TableHead className="text-center w-32">Crecimiento Mensual %</TableHead>
                    <TableHead className="text-right">Vol. Mes 1</TableHead>
                    <TableHead className="text-right">Vol. Mes 12</TableHead>
                    <TableHead className="text-right">Vol. Año 2</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalogoIngresos.map(item => {
                    const tasa = getTasaCrecimientoSKU(item.codigo);
                    const volMes1 = configVolumenes.volumenInicialPorSKU;
                    const volMes12 = Math.round(volMes1 * Math.pow(1 + tasa, 11));
                    const volAño2 = Math.round(volMes1 * Math.pow(1 + tasa, 23));
                    const esPersonalizado = configVolumenes.tasasPorSKU[item.codigo] !== undefined;
                    
                    return (
                      <TableRow key={item.codigo}>
                        <TableCell className="font-mono text-xs">{item.codigo}</TableCell>
                        <TableCell className="font-medium">{item.concepto}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-xs">{item.subCategoria}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.5"
                              value={tasa * 100}
                              onChange={(e) => actualizarTasaCrecimientoSKU(
                                item.codigo, 
                                (parseFloat(e.target.value) || 6) / 100
                              )}
                              className="w-20 h-8 text-center font-mono"
                            />
                            {esPersonalizado && (
                              <Badge variant="outline" className="text-xs">✓</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatServicios(volMes1)}</TableCell>
                        <TableCell className="text-right font-mono">{formatServicios(volMes12)}</TableCell>
                        <TableCell className="text-right font-mono text-emerald-600">{formatServicios(volAño2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Precios */}
        <TabsContent value="precios">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Precios de Venta por SKU
              </CardTitle>
              <CardDescription>
                Modifique los precios base de cada producto. Los cambios se reflejarán en las proyecciones.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Código</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Precio Base</TableHead>
                    <TableHead className="text-right">Precio Actual</TableHead>
                    <TableHead>IVA</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalogoIngresos.map(item => {
                    const precioActual = preciosPersonalizados[item.codigo] ?? item.valorUnitario;
                    const esEditando = editandoItem === item.codigo;
                    const modificado = preciosPersonalizados[item.codigo] !== undefined;
                    
                    return (
                      <TableRow key={item.codigo}>
                        <TableCell className="font-mono text-xs">{item.codigo}</TableCell>
                        <TableCell className="font-medium">{item.concepto}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{item.subCategoria}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {formatCOP(item.valorUnitario)}
                        </TableCell>
                        <TableCell className="text-right">
                          {esEditando ? (
                            <FormattedNumberInput
                              value={valoresEditados[item.codigo] ?? precioActual}
                              onValueChange={(v) => setValoresEditados({
                                ...valoresEditados,
                                [item.codigo]: v,
                              })}
                              className="w-32 h-8 text-right font-mono"
                              autoFocus
                            />
                          ) : (
                            <span className={`font-mono font-bold ${modificado ? 'text-amber-600' : ''}`}>
                              {formatCOP(precioActual)}
                              {modificado && <Edit3 className="inline h-3 w-3 ml-1" />}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.gravaIVA ? (
                            <Badge className="bg-amber-500/20 text-amber-600 text-xs">19%</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Exento</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {esEditando ? (
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => handleGuardarPrecio(item.codigo)}>
                                <Save className="h-4 w-4 text-emerald-500" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditandoItem(null)}>
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => setEditandoItem(item.codigo)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Volúmenes */}
        <TabsContent value="volumenes">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Volúmenes Proyectados (Generados Automáticamente)
                  </CardTitle>
                  <CardDescription>
                    Basados en volumen inicial de {configVolumenes.volumenInicialPorSKU} y tasas de crecimiento configuradas. Puede editar individualmente.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select 
                    value={añoSeleccionado.toString()} 
                    onValueChange={(v) => setAñoSeleccionado(parseInt(v))}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2026, 2027, 2028, 2029, 2030, 2031].map(año => (
                        <SelectItem key={año} value={año.toString()}>{año}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background">SKU</TableHead>
                      {MESES.map(mes => (
                        <TableHead key={mes} className="text-center min-w-16">{mes}</TableHead>
                      ))}
                      <TableHead className="text-right font-bold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catalogoIngresos.map(item => {
                      const volSKU = volumenesAño[item.codigo] || {};
                      const total = Object.values(volSKU).reduce((sum: number, v) => sum + (v as number), 0);
                      
                      return (
                        <TableRow key={item.codigo}>
                          <TableCell className="sticky left-0 bg-background font-mono text-xs whitespace-nowrap">
                            {item.codigo}
                          </TableCell>
                          {MESES.map((_, idx) => (
                            <TableCell key={idx} className="text-center p-1">
                              <Input
                                type="number"
                                value={volSKU[idx + 1] || 0}
                                onChange={(e) => actualizarVolumen(
                                  añoSeleccionado,
                                  item.codigo,
                                  idx + 1,
                                  parseInt(e.target.value) || 0
                                )}
                                className="w-14 h-7 text-center text-xs font-mono p-1"
                              />
                            </TableCell>
                          ))}
                          <TableCell className="text-right font-mono font-bold text-emerald-600">
                            {formatServicios(total)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Cargar CSV */}
        <TabsContent value="catalogo">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Cargar Catálogo Maestro desde CSV
              </CardTitle>
              <CardDescription>
                Suba un archivo CSV con el catálogo de productos, costos y gastos. El sistema detectará automáticamente la categoría por el prefijo del código.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Arrastre un archivo CSV o haga clic para seleccionar
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar Archivo
                </Button>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Formato esperado del CSV:</h4>
                <code className="text-xs block overflow-x-auto whitespace-pre">
{`Código,Concepto,Categoría,Sub-Categoría,Driver,Valor Unitario,Frecuencia,Cuenta PUC,Regla Negocio,Grava IVA,Tasa IVA
ING-001,Consulta Legal Estándar,Ingresos,B2C,Tx,150000,Por Tx,413536,Trigger: Pago completado,false,0
C-VAR-01,Pago Neto Abogado,Costo Venta,Escrow,Tx,100000,Por Tx,281505,Neto Garantizado,false,0`}
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Prefijos reconocidos:</strong> ING- (Ingresos), C-VAR- (Costos Directos), G- (OPEX), IMP- (Impuestos)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
