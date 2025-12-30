/**
 * Three-Statement Financial Model Types
 * Per V6 Spec: Interconnected P&L, Balance, Cash Flow with Triangulation
 */

// ============ BALANCE GENERAL (Statement of Financial Position) ============

export interface ActivosCorrientes {
  efectivo: number;
  cuentasPorCobrar: number;
  inventarios: number;
  gastosAnticipados: number;
  totalCorriente: number;
}

export interface ActivosNoCorrientes {
  propiedadPlantaEquipo: number;
  depreciacionAcumulada: number;
  propiedadPlantaEquipoNeto: number;
  softwareDesarrollo: number;
  amortizacionAcumulada: number;
  softwareNeto: number;
  inversionesLP: number;
  totalNoCorriente: number;
}

export interface PasivosCorrientes {
  cuentasPorPagar: number;
  impuestosPorPagar: number;
  escrowAbogados: number; // ⚠️ CRÍTICO: NO ES NUESTRO DINERO
  ingresosAnticipados: number;
  nominaPorPagar: number;
  totalCorriente: number;
}

export interface PasivosNoCorrientes {
  deudaLargoPlazo: number;
  totalNoCorriente: number;
}

export interface Patrimonio {
  capitalSocial: number;
  reservaLegal: number;
  utilidadesRetenidas: number;
  utilidadDelEjercicio: number;
  totalPatrimonio: number;
}

export interface EcuacionPatrimonial {
  activos: number;
  pasivos: number;
  patrimonio: number;
  diferencia: number;
  valido: boolean; // |diferencia| < 1 COP
}

export interface BalanceGeneral {
  periodo: string;
  fecha: Date;

  activos: {
    corrientes: ActivosCorrientes;
    noCorrientes: ActivosNoCorrientes;
    totalActivos: number;
  };

  pasivos: {
    corrientes: PasivosCorrientes;
    noCorrientes: PasivosNoCorrientes;
    totalPasivos: number;
  };

  patrimonio: Patrimonio;

  ecuacionPatrimonial: EcuacionPatrimonial;
}

// ============ FLUJO DE CAJA (Statement of Cash Flows) ============

export interface FlujoOperativo {
  utilidadNeta: number;

  ajustesNoCash: {
    depreciacion: number;
    amortizacion: number;
    totalAjustes: number;
  };

  cambiosCapitalTrabajo: {
    deltaCuentasPorCobrar: number;   // (Aumento) = negativo
    deltaInventarios: number;
    deltaGastosAnticipados: number;
    deltaCuentasPorPagar: number;    // Aumento = positivo
    deltaImpuestosPorPagar: number;
    deltaEscrowAbogados: number;
    deltaNominaPorPagar: number;
    deltaIngresosAnticipados: number;
    totalCambios: number;
  };

  flujoOperativo: number;
}

export interface FlujoInversion {
  adquisicionPPE: number;           // Negativo (salida)
  inversionSoftware: number;        // Negativo (salida)
  ventaActivos: number;             // Positivo (entrada)
  flujoInversion: number;
}

export interface FlujoFinanciacion {
  emisionAcciones: number;          // Positivo
  pagoDeuda: number;                // Negativo
  dividendosPagados: number;        // Negativo
  aportesSocios: number;            // Positivo
  flujoFinanciacion: number;
}

export interface FlujoDeCaja {
  periodo: string;

  operacion: FlujoOperativo;
  inversion: FlujoInversion;
  financiacion: FlujoFinanciacion;

  resumen: {
    flujoNetoTotal: number;
    efectivoInicial: number;
    efectivoFinal: number;
    conciliaConBalance: boolean;    // ⚠️ VALIDACIÓN CRÍTICA
    diferenciaConBalance: number;
  };
}

// ============ TRIANGULACIÓN (Validation) ============

export interface ErrorTriangulacion {
  tipo: 'balance' | 'flujo' | 'utilidad' | 'escrow';
  mensaje: string;
  valorEsperado: number;
  valorActual: number;
  diferencia: number;
  severidad: 'critica' | 'advertencia' | 'info';
}

export interface ResultadoTriangulacion {
  valido: boolean;
  errores: ErrorTriangulacion[];
  timestamp: Date;

  validaciones: {
    balanceCuadra: boolean;
    flujoConcilia: boolean;
    utilidadCierra: boolean;
    escrowConcilia: boolean;
  };

  metricas: {
    activosTotales: number;
    pasivosTotales: number;
    patrimonioTotal: number;
    efectivoBalance: number;
    efectivoFlujo: number;
    utilidadPyL: number;
    utilidadBalance: number;
  };
}

// ============ THREE-STATEMENT MODEL ============

export interface ThreeStatementModel {
  periodo: string;
  año: number;

  estadoResultados: {
    ingresosBrutos: number;
    costoVentas: number;
    utilidadBruta: number;
    gastosOperativos: number;
    ebitda: number;
    depreciacionAmortizacion: number;
    ebit: number;
    gastosFinancieros: number;
    utilidadAntesImpuestos: number;
    impuestoRenta: number;
    utilidadNeta: number;
  };

  balanceGeneral: BalanceGeneral;
  flujoDeCaja: FlujoDeCaja;
  triangulacion: ResultadoTriangulacion;
}

// ============ CASH CONVERSION CYCLE ============

export interface CashConversionCycle {
  dso: number;  // Days Sales Outstanding
  dpo: number;  // Days Payable Outstanding
  dio: number;  // Days Inventory Outstanding (0 for services)
  ccc: number;  // CCC = DSO + DIO - DPO

  interpretacion: 'positivo' | 'negativo' | 'neutro';
  descripcion: string;
  capitalTrabajoRequerido: number;
}

// ============ ESCROW LEDGER ============

export interface EscrowMovimiento {
  id: string;
  fecha: Date;
  tipo: 'entrada' | 'salida';
  montoBruto: number;
  comisionPlataforma: number;
  retefuenteAsumida: number;
  gmf: number;
  netoAbogado: number;
  estado: 'pendiente' | 'pagado';
  abogadoId?: string;
}

export interface EscrowLedger {
  saldoTotal: number;

  saldosPorAbogado: {
    abogadoId: string;
    nombre: string;
    saldoPendiente: number;
    transaccionesPendientes: number;
    proximoPago: Date | null;
  }[];

  movimientos: EscrowMovimiento[];

  conciliacion: {
    saldoBancario: number;
    saldoEscrow: number;
    saldoOperativo: number;     // = Bancario - Escrow (ESTO es nuestro)
    conciliado: boolean;
  };

  alertas: {
    tipo: 'vencido' | 'descuadre';
    mensaje: string;
    monto: number;
  }[];
}
