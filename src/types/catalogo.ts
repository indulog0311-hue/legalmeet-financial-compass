/**
 * Tipos para el Catálogo Maestro V4.0 - LegalMeet Colombia
 * Sistema Operativo Financiero
 */

export interface CatalogoItem {
  codigo: string;
  concepto: string;
  tipo: 'ingreso' | 'costo_variable' | 'gasto' | 'impuesto' | 'capex';
  categoria: 'Ingresos' | 'Costo Venta' | 'Gastos Tech' | 'Gastos Admin' | 'Nómina' | 'Marketing' | 'Impuestos' | 'Pasivo' | 'Inversión';
  subCategoria: string;
  driver: string;
  valorUnitario: number;
  frecuencia: 'Por Tx' | 'Por Doc' | 'Mensual' | 'Mes' | 'Anual' | 'Bimestral' | 'Única Vez' | 'Por Caso' | 'Por SMS' | 'Variable' | 'Por Verificación';
  cuentaPUC: string;
  observacion: string;
  activo: boolean;
  // Campos opcionales
  gravaIVA?: boolean;
  tasaIVA?: number;
  vinculadoA?: string;
  esCostoOculto?: boolean;
  esPorcentaje?: boolean;
  diasIngreso?: number;
  esNomina?: boolean;
  esCAC?: boolean;
}

export interface VolumenProyectado {
  codigo: string;
  año: number;
  mes: number;
  volumen: number;
  precioUnitario: number;
  ingresoProyectado: number;
  costoDirecto: number;
  margenBruto: number;
}

export interface ProyeccionMensual {
  año: number;
  mes: number;
  periodo: string; // "2026-01"
  diasHabiles: number;
  // Ingresos
  ingresosBrutos: number;
  ivaGenerado: number;
  ingresosNetos: number;
  // Costos Directos
  pagosAbogados: number;
  retefuenteAsumida: number;
  gmf: number;
  pasarela: number;
  whatsapp: number;
  sms: number;
  sagrilaft: number;
  totalCostosDirectos: number;
  // Margen Bruto
  utilidadBruta: number;
  margenBrutoPct: number;
  // OPEX
  nomina: number;
  cloudComputing: number;
  almacenamiento: number;
  marketing: number;
  totalOPEX: number;
  // EBITDA
  ebitda: number;
  margenEBITDAPct: number;
  // Impuestos Operativos
  icaBogota: number;
  // Utilidad Operacional
  utilidadOperacional: number;
  // Provisión Renta
  provisionRenta: number;
  // Utilidad Neta
  utilidadNeta: number;
  margenNetoPct: number;
}

export interface ProyeccionAnual {
  año: number;
  meses: ProyeccionMensual[];
  totales: {
    ingresosBrutos: number;
    ingresosNetos: number;
    totalCostosDirectos: number;
    utilidadBruta: number;
    margenBrutoPct: number;
    totalOPEX: number;
    ebitda: number;
    margenEBITDAPct: number;
    utilidadNeta: number;
    margenNetoPct: number;
  };
}

export interface ParametrosMacroEconomicos {
  año: number;
  inflacionPct: number;
  trm: number;
  tasaRentaPct: number;
  tasaIVAPct: number;
  tasaBanrepPct: number;
  salarioMinimo: number;
  uxoEstimado: number; // Unidad de Valor Tributario
}

export interface ConfiguracionModelo {
  añoInicio: number;
  añoFin: number;
  capitalInicial: number;
  metaGrowthAnual: number;
  mixPagoDigital: number; // % pagos digitales vs efectivo
  tasaChurnMensual: number;
  diasCartera: number;
  diasProveedores: number;
}

// Tasas de crecimiento por SKU
export interface TasasCrecimientoSKU {
  [codigo: string]: number; // porcentaje de crecimiento mensual (default 6%)
}

// Configuración inicial de volúmenes
export interface ConfiguracionVolumenes {
  volumenInicialPorSKU: number; // default 5
  tasaCrecimientoDefault: number; // default 0.06 (6%)
  tasasPorSKU: TasasCrecimientoSKU;
}

export interface FlujoCajaMensual {
  periodo: string;
  // Entradas
  cobroClientes: number;
  recaudoPasarela: number;
  recaudoEfectivo: number;
  totalEntradas: number;
  // Salidas Operativas
  pagosAbogados: number;
  pagosProveedores: number;
  pagosNomina: number;
  pagosMarketing: number;
  pagosCloud: number;
  totalSalidasOperativas: number;
  // Flujo Operativo
  flujoOperativo: number;
  // Impuestos
  pagoIVA: number;
  pagoRetefuente: number;
  pagoICA: number;
  pagoRenta: number;
  totalImpuestos: number;
  // Flujo Neto
  flujoNeto: number;
  // Acumulados
  saldoInicial: number;
  saldoFinal: number;
}

export interface EstadoResultadosIntegral {
  periodo: string;
  añoFiscal: number;
  // Ingresos de Actividades Ordinarias (NIIF 15)
  ingresosOrdinarios: {
    serviciosLegales: number;
    suscripciones: number;
    productosDigitales: number;
    otros: number;
    total: number;
  };
  // Costo de Ventas
  costoVentas: {
    pagosAbogados: number;
    costosPasarela: number;
    costosTransaccionales: number;
    total: number;
  };
  // Utilidad Bruta
  utilidadBruta: number;
  margenBrutoPct: number;
  // Gastos Operacionales
  gastosOperacionales: {
    administracion: {
      personal: number;
      serviciosPublicos: number;
      arriendos: number;
      depreciacion: number;
      otros: number;
      total: number;
    };
    ventas: {
      marketing: number;
      comisiones: number;
      otros: number;
      total: number;
    };
    totalGastosOperacionales: number;
  };
  // Utilidad Operacional
  utilidadOperacional: number;
  margenOperacionalPct: number;
  // Otros Ingresos/Gastos
  otrosIngresos: number;
  otrosGastos: number;
  gastosFinancieros: number;
  // Utilidad Antes de Impuestos
  utilidadAntesImpuestos: number;
  // Impuesto de Renta
  impuestoRenta: number;
  // Utilidad Neta
  utilidadNeta: number;
  margenNetoPct: number;
  // EBITDA (calculado)
  ebitda: number;
  margenEBITDAPct: number;
}

// Tipo para el resumen de Unit Economics
export interface UnitEconomicsDetallado {
  // Por SKU
  porSKU: Record<string, {
    codigo: string;
    concepto: string;
    precioVenta: number;
    costoDirecto: number;
    margenContribucion: number;
    margenPct: number;
  }>;
  // Agregados
  agregados: {
    cac: number;
    ltv: number;
    ltvCacRatio: number;
    paybackMeses: number;
    churnMensual: number;
    arpuMensual: number;
    ticketPromedio: number;
  };
}
