/**
 * Motor de Cálculo Financiero LegalMeet
 * Proyecciones basadas en Catálogo Maestro V4.0
 * Calendario laboral Colombia 2026-2031
 * 
 * NOTA: Los parámetros macro se obtienen del store para evitar dependencias circulares
 */

import {
  CatalogoItem,
  ProyeccionMensual,
  ProyeccionAnual,
  ParametrosMacroEconomicos,
  ConfiguracionModelo,
  FlujoCajaMensual,
  EstadoResultadosIntegral,
} from '@/types/catalogo';

import {
  INGRESOS_CATALOG,
  getCostoVinculado,
  getNominaTotal,
  DIAS_HABILES_2026,
} from '@/lib/constants/catalogoMaestro';

import {
  IMPUESTOS,
  PASARELA,
  COMUNICACIONES,
  TECH,
  OPERACIONES,
} from '@/lib/constants/financialConstants';

// ============ DÍAS HÁBILES POR AÑO (CALENDARIO LABORAL COLOMBIA) ============
export const getDiasHabiles = (año: number, mes: number): number => {
  // Base 2026, ajustar ligeramente para otros años
  const base = DIAS_HABILES_2026[mes as keyof typeof DIAS_HABILES_2026] || OPERACIONES.DIAS_HABILES_MES;
  // Los días hábiles varían poco entre años
  return base;
};

// ============ CÁLCULO DE PRECIO INDEXADO POR INFLACIÓN ============
export const calcularPrecioIndexado = (
  precioBase: number,
  añoBase: number,
  añoActual: number,
  parametrosMacro: ParametrosMacroEconomicos[]
): number => {
  let precio = precioBase;
  for (let año = añoBase; año < añoActual; año++) {
    const params = parametrosMacro.find(p => p.año === año);
    if (params) {
      precio *= (1 + params.inflacionPct / 100);
    }
  }
  return Math.round(precio);
};

// ============ CÁLCULO DE UNIT ECONOMICS POR SKU ============
export const calcularUnitEconomicsPorSKU = (
  ingreso: CatalogoItem,
  volumen: number,
  año: number,
  parametrosMacro: ParametrosMacroEconomicos[],
  mixDigital: number = 0.7 // 70% digital, 30% efectivo
): {
  ingresoTotal: number;
  costoAbogado: number;
  retefuente: number;
  gmf: number;
  pasarela: number;
  sms: number;
  sagrilaft: number;
  whatsapp: number;
  costoTotal: number;
  margenContribucion: number;
  margenPct: number;
} => {
  const precioIndexado = calcularPrecioIndexado(ingreso.valorUnitario, 2026, año, parametrosMacro);
  const ingresoTotal = precioIndexado * volumen;
  
  // Costo del abogado (si aplica)
  const costoVinculado = getCostoVinculado(ingreso.codigo);
  const costoAbogado = costoVinculado 
    ? calcularPrecioIndexado(costoVinculado.valorUnitario, 2026, año, parametrosMacro) * volumen 
    : 0;
  
  // Retefuente asumida (11% sobre pago al abogado para mantener neto)
  const retefuente = costoAbogado > 0 ? costoAbogado * IMPUESTOS.RETEFUENTE_SERVICIOS / (1 - IMPUESTOS.RETEFUENTE_SERVICIOS) : 0;
  
  // GMF 4x1000 sobre el monto a dispersar
  const gmf = (costoAbogado + retefuente) * IMPUESTOS.GMF;
  
  // Pasarela (mix digital vs efectivo)
  const costoPasarela = volumen * (mixDigital * PASARELA.COSTO_TX_DIGITAL + (1 - mixDigital) * PASARELA.COSTO_TX_EFECTIVO);
  
  // SMS (solo para transacciones en efectivo)
  const sms = volumen * (1 - mixDigital) * COMUNICACIONES.SMS_UNITARIO;
  
  // SAGRILAFT (para todas las transacciones)
  const sagrilaft = volumen * COMUNICACIONES.SAGRILAFT_POR_CHECK;
  
  // WhatsApp (1 mensaje por caso)
  const whatsapp = volumen * COMUNICACIONES.WHATSAPP_POR_CONV;
  
  const costoTotal = costoAbogado + retefuente + gmf + costoPasarela + sms + sagrilaft + whatsapp;
  const margenContribucion = ingresoTotal - costoTotal;
  const margenPct = ingresoTotal > 0 ? (margenContribucion / ingresoTotal) * 100 : 0;
  
  return {
    ingresoTotal,
    costoAbogado,
    retefuente,
    gmf,
    pasarela: costoPasarela,
    sms,
    sagrilaft,
    whatsapp,
    costoTotal,
    margenContribucion,
    margenPct
  };
};

// ============ PROYECCIÓN MENSUAL COMPLETA ============
export const calcularProyeccionMensual = (
  año: number,
  mes: number,
  volumenes: Record<string, number>,
  config: ConfiguracionModelo,
  parametrosMacro: ParametrosMacroEconomicos[],
  catalogoIngresos: CatalogoItem[] = INGRESOS_CATALOG
): ProyeccionMensual => {
  const periodo = `${año}-${mes.toString().padStart(2, '0')}`;
  const diasHabiles = getDiasHabiles(año, mes);
  
  // Calcular ingresos por SKU
  let ingresosBrutos = 0;
  let ivaGenerado = 0;
  let pagosAbogados = 0;
  let retefuenteAsumida = 0;
  let gmf = 0;
  let pasarela = 0;
  let whatsapp = 0;
  let sms = 0;
  let sagrilaft = 0;
  
  catalogoIngresos.forEach(ingreso => {
    const volumen = volumenes[ingreso.codigo] || 0;
    if (volumen > 0) {
      const economics = calcularUnitEconomicsPorSKU(ingreso, volumen, año, parametrosMacro, config.mixPagoDigital);
      
      ingresosBrutos += economics.ingresoTotal;
      
      // IVA solo para servicios que gravan
      if (ingreso.gravaIVA) {
        ivaGenerado += economics.ingresoTotal * IMPUESTOS.IVA;
      }
      
      pagosAbogados += economics.costoAbogado;
      retefuenteAsumida += economics.retefuente;
      gmf += economics.gmf;
      pasarela += economics.pasarela;
      whatsapp += economics.whatsapp;
      sms += economics.sms;
      sagrilaft += economics.sagrilaft;
    }
  });
  
  const ingresosNetos = ingresosBrutos; // IVA es pasivo, no se resta
  const totalCostosDirectos = pagosAbogados + retefuenteAsumida + gmf + pasarela + whatsapp + sms + sagrilaft;
  
  const utilidadBruta = ingresosNetos - totalCostosDirectos;
  const margenBrutoPct = ingresosNetos > 0 ? (utilidadBruta / ingresosNetos) * 100 : 0;
  
  // OPEX
  const nominaBase = getNominaTotal();
  const nomina = calcularPrecioIndexado(nominaBase, 2026, año, parametrosMacro);
  
  // Cloud computing (por usuario activo estimado)
  const usuariosActivos = Object.values(volumenes).reduce((a, b) => a + b, 0) / 3; // Estimado
  const cloudComputing = usuariosActivos * TECH.CLOUD_POR_MAU;
  
  // Almacenamiento (1GB por 10 transacciones)
  const almacenamiento = (Object.values(volumenes).reduce((a, b) => a + b, 0) / 10) * 120;
  
  // Marketing (CAC * nuevos clientes estimados)
  const nuevosClientes = Object.values(volumenes).reduce((a, b) => a + b, 0) * 0.1; // 10% son nuevos
  const marketing = nuevosClientes * 35000;
  
  const totalOPEX = nomina + cloudComputing + almacenamiento + marketing;
  
  // EBITDA
  const ebitda = utilidadBruta - totalOPEX;
  const margenEBITDAPct = ingresosNetos > 0 ? (ebitda / ingresosNetos) * 100 : 0;
  
  // ICA Bogotá
  const icaBogota = ingresosBrutos * IMPUESTOS.ICA_BOGOTA;
  
  // Utilidad Operacional
  const utilidadOperacional = ebitda - icaBogota;
  
  // Provisión Renta (mensual)
  const provisionRenta = utilidadOperacional > 0 ? utilidadOperacional * IMPUESTOS.TASA_RENTA : 0;
  
  // Utilidad Neta
  const utilidadNeta = utilidadOperacional - provisionRenta;
  const margenNetoPct = ingresosNetos > 0 ? (utilidadNeta / ingresosNetos) * 100 : 0;
  
  return {
    año,
    mes,
    periodo,
    diasHabiles,
    ingresosBrutos: Math.round(ingresosBrutos),
    ivaGenerado: Math.round(ivaGenerado),
    ingresosNetos: Math.round(ingresosNetos),
    pagosAbogados: Math.round(pagosAbogados),
    retefuenteAsumida: Math.round(retefuenteAsumida),
    gmf: Math.round(gmf),
    pasarela: Math.round(pasarela),
    whatsapp: Math.round(whatsapp),
    sms: Math.round(sms),
    sagrilaft: Math.round(sagrilaft),
    totalCostosDirectos: Math.round(totalCostosDirectos),
    utilidadBruta: Math.round(utilidadBruta),
    margenBrutoPct: Math.round(margenBrutoPct * 100) / 100,
    nomina: Math.round(nomina),
    cloudComputing: Math.round(cloudComputing),
    almacenamiento: Math.round(almacenamiento),
    marketing: Math.round(marketing),
    totalOPEX: Math.round(totalOPEX),
    ebitda: Math.round(ebitda),
    margenEBITDAPct: Math.round(margenEBITDAPct * 100) / 100,
    icaBogota: Math.round(icaBogota),
    utilidadOperacional: Math.round(utilidadOperacional),
    provisionRenta: Math.round(provisionRenta),
    utilidadNeta: Math.round(utilidadNeta),
    margenNetoPct: Math.round(margenNetoPct * 100) / 100
  };
};

// ============ PROYECCIÓN ANUAL ============
export const calcularProyeccionAnual = (
  año: number,
  volumenesMensuales: Record<string, Record<number, number>>,
  config: ConfiguracionModelo,
  parametrosMacro: ParametrosMacroEconomicos[],
  catalogoIngresos?: CatalogoItem[]
): ProyeccionAnual => {
  const meses: ProyeccionMensual[] = [];
  
  for (let mes = 1; mes <= 12; mes++) {
    const volumenesMes: Record<string, number> = {};
    Object.keys(volumenesMensuales).forEach(codigo => {
      volumenesMes[codigo] = volumenesMensuales[codigo]?.[mes] || 0;
    });
    
    meses.push(calcularProyeccionMensual(año, mes, volumenesMes, config, parametrosMacro, catalogoIngresos));
  }
  
  // Calcular totales
  const totales = {
    ingresosBrutos: meses.reduce((sum, m) => sum + m.ingresosBrutos, 0),
    ingresosNetos: meses.reduce((sum, m) => sum + m.ingresosNetos, 0),
    totalCostosDirectos: meses.reduce((sum, m) => sum + m.totalCostosDirectos, 0),
    utilidadBruta: meses.reduce((sum, m) => sum + m.utilidadBruta, 0),
    margenBrutoPct: 0,
    totalOPEX: meses.reduce((sum, m) => sum + m.totalOPEX, 0),
    ebitda: meses.reduce((sum, m) => sum + m.ebitda, 0),
    margenEBITDAPct: 0,
    utilidadNeta: meses.reduce((sum, m) => sum + m.utilidadNeta, 0),
    margenNetoPct: 0
  };
  
  totales.margenBrutoPct = totales.ingresosNetos > 0 
    ? Math.round((totales.utilidadBruta / totales.ingresosNetos) * 10000) / 100 
    : 0;
  totales.margenEBITDAPct = totales.ingresosNetos > 0 
    ? Math.round((totales.ebitda / totales.ingresosNetos) * 10000) / 100 
    : 0;
  totales.margenNetoPct = totales.ingresosNetos > 0 
    ? Math.round((totales.utilidadNeta / totales.ingresosNetos) * 10000) / 100 
    : 0;
  
  return { año, meses, totales };
};

// ============ GENERAR ERI (Estado de Resultados Integral) ============
export const generarERI = (
  proyeccionAnual: ProyeccionAnual
): EstadoResultadosIntegral => {
  const { totales, año } = proyeccionAnual;
  
  // Desglosar ingresos por tipo
  const ingresosOrdinarios = {
    serviciosLegales: Math.round(totales.ingresosBrutos * 0.60), // Consultas + SOS
    suscripciones: Math.round(totales.ingresosBrutos * 0.25), // Pro + B2B
    productosDigitales: Math.round(totales.ingresosBrutos * 0.12), // Flash + Docs
    otros: Math.round(totales.ingresosBrutos * 0.03), // Onboarding
    total: totales.ingresosBrutos
  };
  
  // Ajustar para que cuadre
  ingresosOrdinarios.otros = ingresosOrdinarios.total - ingresosOrdinarios.serviciosLegales 
    - ingresosOrdinarios.suscripciones - ingresosOrdinarios.productosDigitales;
  
  const costoVentas = {
    pagosAbogados: Math.round(totales.totalCostosDirectos * 0.70),
    costosPasarela: Math.round(totales.totalCostosDirectos * 0.20),
    costosTransaccionales: Math.round(totales.totalCostosDirectos * 0.10),
    total: totales.totalCostosDirectos
  };
  
  const depreciacion = 5000000; // Depreciación anual estimada
  
  const gastosOperacionales = {
    administracion: {
      personal: Math.round(totales.totalOPEX * 0.65),
      serviciosPublicos: 2400000,
      arriendos: 0, // Remoto
      depreciacion,
      otros: Math.round(totales.totalOPEX * 0.05),
      total: 0
    },
    ventas: {
      marketing: Math.round(totales.totalOPEX * 0.25),
      comisiones: 0,
      otros: Math.round(totales.totalOPEX * 0.05),
      total: 0
    },
    totalGastosOperacionales: totales.totalOPEX
  };
  
  gastosOperacionales.administracion.total = gastosOperacionales.administracion.personal +
    gastosOperacionales.administracion.serviciosPublicos + gastosOperacionales.administracion.arriendos +
    gastosOperacionales.administracion.depreciacion + gastosOperacionales.administracion.otros;
  
  gastosOperacionales.ventas.total = gastosOperacionales.ventas.marketing +
    gastosOperacionales.ventas.comisiones + gastosOperacionales.ventas.otros;
  
  const utilidadOperacional = totales.utilidadBruta - totales.totalOPEX;
  const margenOperacionalPct = totales.ingresosNetos > 0 
    ? Math.round((utilidadOperacional / totales.ingresosNetos) * 10000) / 100 
    : 0;
  
  const gastosFinancieros = Math.round(totales.ingresosBrutos * 0.005); // 0.5% estimado
  const utilidadAntesImpuestos = utilidadOperacional - gastosFinancieros;
  const impuestoRenta = utilidadAntesImpuestos > 0 ? Math.round(utilidadAntesImpuestos * IMPUESTOS.TASA_RENTA) : 0;
  
  return {
    periodo: `${año}`,
    añoFiscal: año,
    ingresosOrdinarios,
    costoVentas,
    utilidadBruta: totales.utilidadBruta,
    margenBrutoPct: totales.margenBrutoPct,
    gastosOperacionales,
    utilidadOperacional,
    margenOperacionalPct,
    otrosIngresos: 0,
    otrosGastos: 0,
    gastosFinancieros,
    utilidadAntesImpuestos,
    impuestoRenta,
    utilidadNeta: utilidadAntesImpuestos - impuestoRenta,
    margenNetoPct: totales.margenNetoPct,
    ebitda: totales.ebitda + depreciacion,
    margenEBITDAPct: totales.margenEBITDAPct
  };
};

// ============ GENERAR FLUJO DE CAJA ============
export const generarFlujoCajaMensual = (
  proyeccion: ProyeccionMensual,
  saldoInicial: number,
  config: ConfiguracionModelo
): FlujoCajaMensual => {
  // Desfase de cobros (días cartera)
  const factorCobro = 1 - (config.diasCartera / 30) * 0.1; // Aproximación
  const cobroClientes = proyeccion.ingresosBrutos * factorCobro;
  
  // Recaudo por canal
  const recaudoPasarela = cobroClientes * config.mixPagoDigital;
  const recaudoEfectivo = cobroClientes * (1 - config.mixPagoDigital);
  const totalEntradas = cobroClientes;
  
  // Salidas operativas
  const pagosAbogados = proyeccion.pagosAbogados; // T+5
  const pagosProveedores = proyeccion.pasarela + proyeccion.whatsapp + proyeccion.sms + proyeccion.sagrilaft;
  const pagosNomina = proyeccion.nomina;
  const pagosMarketing = proyeccion.marketing;
  const pagosCloud = proyeccion.cloudComputing + proyeccion.almacenamiento;
  const totalSalidasOperativas = pagosAbogados + pagosProveedores + pagosNomina + pagosMarketing + pagosCloud;
  
  const flujoOperativo = totalEntradas - totalSalidasOperativas;
  
  // Impuestos (bimestrales, prorrateados)
  const pagoIVA = proyeccion.ivaGenerado * 0.5; // Pago bimestral prorrateado
  const pagoRetefuente = proyeccion.retefuenteAsumida;
  const pagoICA = proyeccion.icaBogota * 0.5; // Pago bimestral prorrateado
  const pagoRenta = proyeccion.provisionRenta; // Provisión mensual
  const totalImpuestos = pagoIVA + pagoRetefuente + pagoICA + pagoRenta;
  
  const flujoNeto = flujoOperativo - totalImpuestos - proyeccion.gmf;
  const saldoFinal = saldoInicial + flujoNeto;
  
  return {
    periodo: proyeccion.periodo,
    cobroClientes: Math.round(cobroClientes),
    recaudoPasarela: Math.round(recaudoPasarela),
    recaudoEfectivo: Math.round(recaudoEfectivo),
    totalEntradas: Math.round(totalEntradas),
    pagosAbogados: Math.round(pagosAbogados),
    pagosProveedores: Math.round(pagosProveedores),
    pagosNomina: Math.round(pagosNomina),
    pagosMarketing: Math.round(pagosMarketing),
    pagosCloud: Math.round(pagosCloud),
    totalSalidasOperativas: Math.round(totalSalidasOperativas),
    flujoOperativo: Math.round(flujoOperativo),
    pagoIVA: Math.round(pagoIVA),
    pagoRetefuente: Math.round(pagoRetefuente),
    pagoICA: Math.round(pagoICA),
    pagoRenta: Math.round(pagoRenta),
    totalImpuestos: Math.round(totalImpuestos),
    flujoNeto: Math.round(flujoNeto),
    saldoInicial: Math.round(saldoInicial),
    saldoFinal: Math.round(saldoFinal)
  };
};
