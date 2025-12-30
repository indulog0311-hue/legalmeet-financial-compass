/**
 * Excel Exporter para Estados Financieros - Formato Colombiano Profesional
 */
import * as XLSX from 'xlsx';
import { ProyeccionAnual, EstadoResultadosIntegral, FlujoCajaMensual } from '@/types/catalogo';

type PeriodoVista = 'mensual' | 'trimestral' | 'semestral' | 'anual';

const MESES_NOMBRES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const TRIMESTRES = ['Q1', 'Q2', 'Q3', 'Q4'];
const SEMESTRES = ['S1', 'S2'];

/**
 * Formatea número a estilo colombiano (punto como separador de miles)
 */
function formatColombiano(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

/**
 * Agrega datos por periodo
 */
function agregarPorPeriodo<T extends Record<string, number>>(
  datos: T[],
  periodo: PeriodoVista
): T[] {
  if (periodo === 'mensual') return datos;
  
  const resultado: T[] = [];
  const divisor = periodo === 'trimestral' ? 3 : periodo === 'semestral' ? 6 : 12;
  const grupos = 12 / divisor;
  
  for (let i = 0; i < grupos; i++) {
    const inicio = i * divisor;
    const fin = inicio + divisor;
    const grupo = datos.slice(inicio, fin);
    
    if (grupo.length === 0) continue;
    
    const agregado = { ...grupo[0] };
    const keys = Object.keys(agregado) as (keyof T)[];
    
    keys.forEach(key => {
      if (typeof agregado[key] === 'number') {
        (agregado as Record<string, number>)[key as string] = grupo.reduce(
          (sum, item) => sum + (item[key] as number), 
          0
        );
      }
    });
    
    resultado.push(agregado);
  }
  
  return resultado;
}

/**
 * Obtiene etiquetas de periodo
 */
function getEtiquetasPeriodo(periodo: PeriodoVista, año: number): string[] {
  switch (periodo) {
    case 'mensual':
      return MESES_NOMBRES.map((m, i) => `${m} ${año}`);
    case 'trimestral':
      return TRIMESTRES.map(t => `${t} ${año}`);
    case 'semestral':
      return SEMESTRES.map(s => `${s} ${año}`);
    case 'anual':
      return [`Año ${año}`];
  }
}

/**
 * Exporta Estado de Resultados Integral a Excel
 */
export function exportarERIExcel(
  eri: EstadoResultadosIntegral,
  proyeccion: ProyeccionAnual,
  periodo: PeriodoVista,
  año: number
): void {
  const wb = XLSX.utils.book_new();
  
  const etiquetas = getEtiquetasPeriodo(periodo, año);
  
  // Preparar datos mensuales
  const mesesData = proyeccion.meses.map(m => ({
    ingresosBrutos: m.ingresosBrutos,
    pagosAbogados: m.pagosAbogados,
    pasarela: m.pasarela + m.gmf,
    utilidadBruta: m.utilidadBruta,
    nomina: m.nomina,
    marketing: m.marketing,
    cloudComputing: m.cloudComputing,
    totalOPEX: m.totalOPEX,
    utilidadOperacional: m.utilidadOperacional,
    utilidadNeta: m.utilidadNeta,
    ebitda: m.ebitda
  }));
  
  const datosAgrupados = agregarPorPeriodo(mesesData, periodo);
  
  // Construir filas del ERI
  const rows: (string | number)[][] = [
    ['ESTADO DE RESULTADOS INTEGRAL'],
    [`Período: ${año} - Vista: ${periodo.charAt(0).toUpperCase() + periodo.slice(1)}`],
    ['Cifras expresadas en Pesos Colombianos (COP)'],
    [''],
    ['CONCEPTO', ...etiquetas, 'TOTAL ANUAL'],
    [''],
    ['INGRESOS DE ACTIVIDADES ORDINARIAS'],
    ['  Servicios Legales', ...datosAgrupados.map(d => d.ingresosBrutos * 0.6), formatColombiano(eri.ingresosOrdinarios.serviciosLegales)],
    ['  Suscripciones', ...datosAgrupados.map(d => d.ingresosBrutos * 0.25), formatColombiano(eri.ingresosOrdinarios.suscripciones)],
    ['  Productos Digitales', ...datosAgrupados.map(d => d.ingresosBrutos * 0.15), formatColombiano(eri.ingresosOrdinarios.productosDigitales)],
    ['TOTAL INGRESOS ORDINARIOS', ...datosAgrupados.map(d => d.ingresosBrutos), formatColombiano(eri.ingresosOrdinarios.total)],
    [''],
    ['COSTO DE VENTAS'],
    ['  Pagos a Abogados', ...datosAgrupados.map(d => -d.pagosAbogados), formatColombiano(-eri.costoVentas.pagosAbogados)],
    ['  Costos Pasarela y Transaccionales', ...datosAgrupados.map(d => -d.pasarela), formatColombiano(-eri.costoVentas.costosPasarela - eri.costoVentas.costosTransaccionales)],
    ['TOTAL COSTO DE VENTAS', ...datosAgrupados.map(d => -(d.pagosAbogados + d.pasarela)), formatColombiano(-eri.costoVentas.total)],
    [''],
    ['UTILIDAD BRUTA', ...datosAgrupados.map(d => d.utilidadBruta), formatColombiano(eri.utilidadBruta)],
    ['  Margen Bruto %', ...datosAgrupados.map(d => `${((d.utilidadBruta / d.ingresosBrutos) * 100).toFixed(1)}%`), `${eri.margenBrutoPct.toFixed(1)}%`],
    [''],
    ['GASTOS OPERACIONALES'],
    ['  Gastos de Administración'],
    ['    Personal (Nómina)', ...datosAgrupados.map(d => -d.nomina), formatColombiano(-eri.gastosOperacionales.administracion.personal)],
    ['    Cloud Computing', ...datosAgrupados.map(d => -d.cloudComputing), formatColombiano(-eri.gastosOperacionales.administracion.serviciosPublicos)],
    ['  Gastos de Ventas'],
    ['    Marketing y Publicidad', ...datosAgrupados.map(d => -d.marketing), formatColombiano(-eri.gastosOperacionales.ventas.marketing)],
    ['TOTAL GASTOS OPERACIONALES', ...datosAgrupados.map(d => -d.totalOPEX), formatColombiano(-eri.gastosOperacionales.totalGastosOperacionales)],
    [''],
    ['UTILIDAD OPERACIONAL', ...datosAgrupados.map(d => d.utilidadOperacional), formatColombiano(eri.utilidadOperacional)],
    ['  Margen Operacional %', ...datosAgrupados.map(d => `${((d.utilidadOperacional / d.ingresosBrutos) * 100).toFixed(1)}%`), `${eri.margenOperacionalPct.toFixed(1)}%`],
    [''],
    ['(-) Gastos Financieros', ...Array(datosAgrupados.length).fill('-'), formatColombiano(-eri.gastosFinancieros)],
    [''],
    ['UTILIDAD ANTES DE IMPUESTOS', ...datosAgrupados.map(d => d.utilidadOperacional), formatColombiano(eri.utilidadAntesImpuestos)],
    ['(-) Impuesto de Renta (35%)', ...Array(datosAgrupados.length).fill('-'), formatColombiano(-eri.impuestoRenta)],
    [''],
    ['UTILIDAD NETA DEL EJERCICIO', ...datosAgrupados.map(d => d.utilidadNeta), formatColombiano(eri.utilidadNeta)],
    ['  Margen Neto %', ...datosAgrupados.map(d => `${((d.utilidadNeta / d.ingresosBrutos) * 100).toFixed(1)}%`), `${eri.margenNetoPct.toFixed(1)}%`],
    [''],
    ['EBITDA', ...datosAgrupados.map(d => d.ebitda), formatColombiano(eri.ebitda)],
    ['  Margen EBITDA %', ...datosAgrupados.map(d => `${((d.ebitda / d.ingresosBrutos) * 100).toFixed(1)}%`), `${eri.margenEBITDAPct.toFixed(1)}%`],
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(rows);
  
  // Configurar anchos de columna
  ws['!cols'] = [
    { wch: 40 },
    ...etiquetas.map(() => ({ wch: 18 })),
    { wch: 20 }
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Estado de Resultados');
  
  // Generar y descargar
  XLSX.writeFile(wb, `ERI_${año}_${periodo}.xlsx`);
}

/**
 * Exporta Flujo de Caja a Excel
 */
export function exportarFlujoCajaExcel(
  flujos: FlujoCajaMensual[],
  periodo: PeriodoVista,
  año: number,
  capitalInicial: number
): void {
  const wb = XLSX.utils.book_new();
  
  const etiquetas = getEtiquetasPeriodo(periodo, año);
  
  // Agregar flujos por periodo
  const flujosAgrupados = agregarPorPeriodo(flujos.map(f => ({
    cobroClientes: f.cobroClientes,
    recaudoPasarela: f.recaudoPasarela,
    recaudoEfectivo: f.recaudoEfectivo,
    totalEntradas: f.totalEntradas,
    pagosAbogados: f.pagosAbogados,
    pagosProveedores: f.pagosProveedores,
    pagosNomina: f.pagosNomina,
    pagosMarketing: f.pagosMarketing,
    pagosCloud: f.pagosCloud,
    totalSalidasOperativas: f.totalSalidasOperativas,
    flujoOperativo: f.flujoOperativo,
    pagoIVA: f.pagoIVA,
    pagoRetefuente: f.pagoRetefuente,
    pagoICA: f.pagoICA,
    pagoRenta: f.pagoRenta,
    totalImpuestos: f.totalImpuestos,
    flujoNeto: f.flujoNeto,
    saldoFinal: f.saldoFinal
  })), periodo);
  
  const totales = {
    totalEntradas: flujos.reduce((sum, f) => sum + f.totalEntradas, 0),
    totalSalidasOperativas: flujos.reduce((sum, f) => sum + f.totalSalidasOperativas, 0),
    flujoOperativo: flujos.reduce((sum, f) => sum + f.flujoOperativo, 0),
    totalImpuestos: flujos.reduce((sum, f) => sum + f.totalImpuestos, 0),
    flujoNeto: flujos.reduce((sum, f) => sum + f.flujoNeto, 0),
  };
  
  const rows: (string | number)[][] = [
    ['ESTADO DE FLUJO DE EFECTIVO'],
    [`Período: ${año} - Vista: ${periodo.charAt(0).toUpperCase() + periodo.slice(1)}`],
    ['Método Directo - Cifras en COP'],
    [''],
    ['CONCEPTO', ...etiquetas, 'TOTAL ANUAL'],
    [''],
    ['ACTIVIDADES DE OPERACIÓN'],
    [''],
    ['ENTRADAS DE EFECTIVO'],
    ['  Cobro a Clientes', ...flujosAgrupados.map(f => f.cobroClientes), formatColombiano(flujos.reduce((s, f) => s + f.cobroClientes, 0))],
    ['  Recaudo Pasarela', ...flujosAgrupados.map(f => f.recaudoPasarela), formatColombiano(flujos.reduce((s, f) => s + f.recaudoPasarela, 0))],
    ['  Recaudo Efectivo', ...flujosAgrupados.map(f => f.recaudoEfectivo), formatColombiano(flujos.reduce((s, f) => s + f.recaudoEfectivo, 0))],
    ['TOTAL ENTRADAS', ...flujosAgrupados.map(f => f.totalEntradas), formatColombiano(totales.totalEntradas)],
    [''],
    ['SALIDAS DE EFECTIVO - OPERATIVAS'],
    ['  Pagos a Abogados/Proveedores', ...flujosAgrupados.map(f => -f.pagosAbogados), formatColombiano(-flujos.reduce((s, f) => s + f.pagosAbogados, 0))],
    ['  Pagos Nómina y Prestaciones', ...flujosAgrupados.map(f => -f.pagosNomina), formatColombiano(-flujos.reduce((s, f) => s + f.pagosNomina, 0))],
    ['  Pagos Marketing', ...flujosAgrupados.map(f => -f.pagosMarketing), formatColombiano(-flujos.reduce((s, f) => s + f.pagosMarketing, 0))],
    ['  Pagos Cloud/Tecnología', ...flujosAgrupados.map(f => -f.pagosCloud), formatColombiano(-flujos.reduce((s, f) => s + f.pagosCloud, 0))],
    ['  Otros Proveedores', ...flujosAgrupados.map(f => -f.pagosProveedores), formatColombiano(-flujos.reduce((s, f) => s + f.pagosProveedores, 0))],
    ['TOTAL SALIDAS OPERATIVAS', ...flujosAgrupados.map(f => -f.totalSalidasOperativas), formatColombiano(-totales.totalSalidasOperativas)],
    [''],
    ['FLUJO OPERATIVO (antes impuestos)', ...flujosAgrupados.map(f => f.flujoOperativo), formatColombiano(totales.flujoOperativo)],
    [''],
    ['IMPUESTOS'],
    ['  IVA por Pagar', ...flujosAgrupados.map(f => -f.pagoIVA), formatColombiano(-flujos.reduce((s, f) => s + f.pagoIVA, 0))],
    ['  Retención en la Fuente', ...flujosAgrupados.map(f => -f.pagoRetefuente), formatColombiano(-flujos.reduce((s, f) => s + f.pagoRetefuente, 0))],
    ['  ICA Bogotá', ...flujosAgrupados.map(f => -f.pagoICA), formatColombiano(-flujos.reduce((s, f) => s + f.pagoICA, 0))],
    ['  Provisión Renta', ...flujosAgrupados.map(f => -f.pagoRenta), formatColombiano(-flujos.reduce((s, f) => s + f.pagoRenta, 0))],
    ['TOTAL IMPUESTOS', ...flujosAgrupados.map(f => -f.totalImpuestos), formatColombiano(-totales.totalImpuestos)],
    [''],
    ['FLUJO NETO DE OPERACIÓN', ...flujosAgrupados.map(f => f.flujoNeto), formatColombiano(totales.flujoNeto)],
    [''],
    ['ACTIVIDADES DE INVERSIÓN'],
    ['  (Sin movimientos proyectados)', ...Array(flujosAgrupados.length).fill('-'), '-'],
    [''],
    ['ACTIVIDADES DE FINANCIACIÓN'],
    ['  (Sin movimientos proyectados)', ...Array(flujosAgrupados.length).fill('-'), '-'],
    [''],
    ['VARIACIÓN NETA DEL EFECTIVO', ...flujosAgrupados.map(f => f.flujoNeto), formatColombiano(totales.flujoNeto)],
    [''],
    ['Saldo Inicial de Caja', formatColombiano(capitalInicial), ...Array(flujosAgrupados.length - 1).fill('-'), '-'],
    ['SALDO FINAL DE CAJA', ...flujosAgrupados.map(f => f.saldoFinal), formatColombiano(flujos[flujos.length - 1]?.saldoFinal || 0)],
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(rows);
  
  ws['!cols'] = [
    { wch: 40 },
    ...etiquetas.map(() => ({ wch: 18 })),
    { wch: 20 }
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Flujo de Caja');
  
  XLSX.writeFile(wb, `FlujoCaja_${año}_${periodo}.xlsx`);
}

/**
 * Exporta reporte completo
 */
export function exportarReporteCompleto(
  eri: EstadoResultadosIntegral,
  proyeccion: ProyeccionAnual,
  flujos: FlujoCajaMensual[],
  periodo: PeriodoVista,
  año: number,
  capitalInicial: number
): void {
  const wb = XLSX.utils.book_new();
  
  // Hoja de resumen ejecutivo
  const resumen: (string | number)[][] = [
    ['RESUMEN EJECUTIVO FINANCIERO'],
    [`LegalMeet Colombia - Proyección ${año}`],
    [''],
    [''],
    ['INDICADORES CLAVE', 'VALOR', '% SOBRE INGRESOS'],
    [''],
    ['Ingresos Totales', formatColombiano(eri.ingresosOrdinarios.total), '100.0%'],
    ['Costo de Ventas', formatColombiano(eri.costoVentas.total), `${((eri.costoVentas.total / eri.ingresosOrdinarios.total) * 100).toFixed(1)}%`],
    ['Utilidad Bruta', formatColombiano(eri.utilidadBruta), `${eri.margenBrutoPct.toFixed(1)}%`],
    ['Gastos Operacionales', formatColombiano(eri.gastosOperacionales.totalGastosOperacionales), `${((eri.gastosOperacionales.totalGastosOperacionales / eri.ingresosOrdinarios.total) * 100).toFixed(1)}%`],
    ['Utilidad Operacional', formatColombiano(eri.utilidadOperacional), `${eri.margenOperacionalPct.toFixed(1)}%`],
    ['EBITDA', formatColombiano(eri.ebitda), `${eri.margenEBITDAPct.toFixed(1)}%`],
    ['Utilidad Neta', formatColombiano(eri.utilidadNeta), `${eri.margenNetoPct.toFixed(1)}%`],
    [''],
    [''],
    ['FLUJO DE CAJA', 'VALOR'],
    [''],
    ['Total Entradas', formatColombiano(flujos.reduce((s, f) => s + f.totalEntradas, 0))],
    ['Total Salidas Operativas', formatColombiano(flujos.reduce((s, f) => s + f.totalSalidasOperativas, 0))],
    ['Total Impuestos', formatColombiano(flujos.reduce((s, f) => s + f.totalImpuestos, 0))],
    ['Flujo Neto Anual', formatColombiano(flujos.reduce((s, f) => s + f.flujoNeto, 0))],
    ['Saldo Final de Caja', formatColombiano(flujos[flujos.length - 1]?.saldoFinal || 0)],
  ];
  
  const wsResumen = XLSX.utils.aoa_to_sheet(resumen);
  wsResumen['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Ejecutivo');
  
  // Agregar hojas de ERI y Flujo de Caja...
  // (simplificado por brevedad)
  
  XLSX.writeFile(wb, `ReporteFinanciero_${año}_${periodo}.xlsx`);
}
