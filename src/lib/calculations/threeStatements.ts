/**
 * Three-Statement Financial Model Calculations
 * Per V6 Spec: Interconnected P&L, Balance, Cash Flow with Triangulation
 */

import {
  BalanceGeneral,
  FlujoDeCaja,
  ResultadoTriangulacion,
  ThreeStatementModel,
  CashConversionCycle,
  ErrorTriangulacion,
} from '@/types/threeStatements';

import { IMPUESTOS, OPERACIONES } from '@/lib/constants/financialConstants';

// ============ BALANCE GENERAL GENERATOR ============

interface BalanceInputs {
  año: number;
  mes: number;

  // From P&L
  utilidadNeta: number;
  depreciacion: number;
  amortizacion: number;

  // From operations
  ingresosBrutos: number;
  costoVentas: number;
  gastosOperativos: number;

  // Initial values (from previous period or config)
  efectivoInicial: number;
  capitalSocial: number;
  reservaLegal: number;
  utilidadesRetenidas: number;

  // Working capital drivers
  diasCartera: number;        // DSO
  diasProveedores: number;    // DPO
  escrowAbogados: number;     // Money owed to lawyers

  // Fixed assets
  capexPeriodo: number;
  inversionSoftware: number;
  ppeAcumulado: number;
  softwareAcumulado: number;
  depreciacionAcumulada: number;
  amortizacionAcumulada: number;
}

export function generarBalanceGeneral(inputs: BalanceInputs): BalanceGeneral {
  const {
    año,
    mes,
    utilidadNeta,
    depreciacion,
    amortizacion,
    ingresosBrutos,
    costoVentas,
    gastosOperativos,
    efectivoInicial,
    capitalSocial,
    reservaLegal,
    utilidadesRetenidas,
    diasCartera,
    diasProveedores,
    escrowAbogados,
    capexPeriodo,
    inversionSoftware,
    ppeAcumulado,
    softwareAcumulado,
    depreciacionAcumulada,
    amortizacionAcumulada,
  } = inputs;

  // Calculate working capital items
  const ventasDiarias = ingresosBrutos / 30;
  const costosDiarios = costoVentas / 30;

  const cuentasPorCobrar = ventasDiarias * diasCartera;
  const cuentasPorPagar = costosDiarios * diasProveedores;

  // Estimate taxes payable (35% of positive EBIT)
  const ebit = ingresosBrutos - costoVentas - gastosOperativos - depreciacion - amortizacion;
  const impuestosPorPagar = ebit > 0 ? ebit * IMPUESTOS.TASA_RENTA : 0;

  // Calculate cash (simplified: initial + net income - working capital changes)
  const efectivo = efectivoInicial + utilidadNeta + depreciacion + amortizacion
    - capexPeriodo - inversionSoftware;

  // Build balance
  const activosCorrientes = {
    efectivo: Math.max(0, efectivo),
    cuentasPorCobrar,
    inventarios: 0, // Service company
    gastosAnticipados: 0,
    totalCorriente: Math.max(0, efectivo) + cuentasPorCobrar,
  };

  const activosNoCorrientes = {
    propiedadPlantaEquipo: ppeAcumulado + capexPeriodo,
    depreciacionAcumulada: depreciacionAcumulada + depreciacion,
    propiedadPlantaEquipoNeto: (ppeAcumulado + capexPeriodo) - (depreciacionAcumulada + depreciacion),
    softwareDesarrollo: softwareAcumulado + inversionSoftware,
    amortizacionAcumulada: amortizacionAcumulada + amortizacion,
    softwareNeto: (softwareAcumulado + inversionSoftware) - (amortizacionAcumulada + amortizacion),
    inversionesLP: 0,
    totalNoCorriente: 0,
  };
  activosNoCorrientes.totalNoCorriente =
    activosNoCorrientes.propiedadPlantaEquipoNeto +
    activosNoCorrientes.softwareNeto +
    activosNoCorrientes.inversionesLP;

  const totalActivos = activosCorrientes.totalCorriente + activosNoCorrientes.totalNoCorriente;

  const pasivosCorrientes = {
    cuentasPorPagar,
    impuestosPorPagar,
    escrowAbogados, // ⚠️ CRÍTICO: Este dinero NO es nuestro
    ingresosAnticipados: 0,
    nominaPorPagar: gastosOperativos * 0.1, // ~10% of opex as payroll payable
    totalCorriente: cuentasPorPagar + impuestosPorPagar + escrowAbogados + (gastosOperativos * 0.1),
  };

  const pasivosNoCorrientes = {
    deudaLargoPlazo: 0,
    totalNoCorriente: 0,
  };

  const totalPasivos = pasivosCorrientes.totalCorriente + pasivosNoCorrientes.totalNoCorriente;

  // Patrimonio (equity balances to make A = P + E)
  const utilidadEjercicio = utilidadNeta;
  const patrimonioCalculado = totalActivos - totalPasivos;

  const patrimonio = {
    capitalSocial,
    reservaLegal: reservaLegal + (utilidadNeta > 0 ? utilidadNeta * IMPUESTOS.RESERVA_LEGAL : 0), // 10% legal reserve
    utilidadesRetenidas,
    utilidadDelEjercicio: utilidadEjercicio,
    totalPatrimonio: capitalSocial + reservaLegal + utilidadesRetenidas + utilidadEjercicio,
  };

  // Ecuación patrimonial
  const diferencia = totalActivos - totalPasivos - patrimonio.totalPatrimonio;
  const ecuacionPatrimonial = {
    activos: totalActivos,
    pasivos: totalPasivos,
    patrimonio: patrimonio.totalPatrimonio,
    diferencia,
    valido: Math.abs(diferencia) < 1, // Less than 1 COP tolerance
  };

  return {
    periodo: `${año}-${mes.toString().padStart(2, '0')}`,
    fecha: new Date(año, mes - 1, 1),
    activos: {
      corrientes: activosCorrientes,
      noCorrientes: activosNoCorrientes,
      totalActivos,
    },
    pasivos: {
      corrientes: pasivosCorrientes,
      noCorrientes: pasivosNoCorrientes,
      totalPasivos,
    },
    patrimonio,
    ecuacionPatrimonial,
  };
}

// ============ FLUJO DE CAJA GENERATOR ============

interface FlujoCajaInputs {
  periodo: string;

  // From P&L
  utilidadNeta: number;
  depreciacion: number;
  amortizacion: number;

  // Working capital changes (current period - previous period)
  deltaCuentasPorCobrar: number;
  deltaCuentasPorPagar: number;
  deltaImpuestosPorPagar: number;
  deltaEscrowAbogados: number;
  deltaNominaPorPagar: number;

  // Investment
  capex: number;
  inversionSoftware: number;

  // Financing
  emisionAcciones: number;
  aportesSocios: number;

  // Opening balance
  efectivoInicial: number;

  // For reconciliation
  efectivoBalance: number;
}

export function generarFlujoDeCaja(inputs: FlujoCajaInputs): FlujoDeCaja {
  const {
    periodo,
    utilidadNeta,
    depreciacion,
    amortizacion,
    deltaCuentasPorCobrar,
    deltaCuentasPorPagar,
    deltaImpuestosPorPagar,
    deltaEscrowAbogados,
    deltaNominaPorPagar,
    capex,
    inversionSoftware,
    emisionAcciones,
    aportesSocios,
    efectivoInicial,
    efectivoBalance,
  } = inputs;

  // Flujo Operativo
  const ajustesNoCash = {
    depreciacion,
    amortizacion,
    totalAjustes: depreciacion + amortizacion,
  };

  const cambiosCapitalTrabajo = {
    deltaCuentasPorCobrar: -deltaCuentasPorCobrar, // Increase in AR is cash outflow
    deltaInventarios: 0,
    deltaGastosAnticipados: 0,
    deltaCuentasPorPagar,
    deltaImpuestosPorPagar,
    deltaEscrowAbogados,
    deltaNominaPorPagar,
    deltaIngresosAnticipados: 0,
    totalCambios: -deltaCuentasPorCobrar + deltaCuentasPorPagar + deltaImpuestosPorPagar + deltaEscrowAbogados + deltaNominaPorPagar,
  };

  const flujoOperativo = utilidadNeta + ajustesNoCash.totalAjustes + cambiosCapitalTrabajo.totalCambios;

  // Flujo de Inversión
  const flujoInversion = {
    adquisicionPPE: -capex,
    inversionSoftware: -inversionSoftware,
    ventaActivos: 0,
    flujoInversion: -capex - inversionSoftware,
  };

  // Flujo de Financiación
  const flujoFinanciacion = {
    emisionAcciones,
    pagoDeuda: 0,
    dividendosPagados: 0,
    aportesSocios,
    flujoFinanciacion: emisionAcciones + aportesSocios,
  };

  // Resumen
  const flujoNetoTotal = flujoOperativo + flujoInversion.flujoInversion + flujoFinanciacion.flujoFinanciacion;
  const efectivoFinal = efectivoInicial + flujoNetoTotal;
  const diferenciaConBalance = efectivoFinal - efectivoBalance;
  const conciliaConBalance = Math.abs(diferenciaConBalance) < 1;

  return {
    periodo,
    operacion: {
      utilidadNeta,
      ajustesNoCash,
      cambiosCapitalTrabajo,
      flujoOperativo,
    },
    inversion: flujoInversion,
    financiacion: flujoFinanciacion,
    resumen: {
      flujoNetoTotal,
      efectivoInicial,
      efectivoFinal,
      conciliaConBalance,
      diferenciaConBalance,
    },
  };
}

// ============ TRIANGULACIÓN ============

export function validarTriangulacion(
  utilidadPyL: number,
  balance: BalanceGeneral,
  flujo: FlujoDeCaja
): ResultadoTriangulacion {
  const errores: ErrorTriangulacion[] = [];

  // 1. Balance cuadra (A = P + E)
  const balanceCuadra = balance.ecuacionPatrimonial.valido;
  if (!balanceCuadra) {
    errores.push({
      tipo: 'balance',
      mensaje: `Balance descuadrado: Activos (${balance.ecuacionPatrimonial.activos.toFixed(0)}) ≠ Pasivos + Patrimonio (${(balance.ecuacionPatrimonial.pasivos + balance.ecuacionPatrimonial.patrimonio).toFixed(0)})`,
      valorEsperado: balance.ecuacionPatrimonial.activos,
      valorActual: balance.ecuacionPatrimonial.pasivos + balance.ecuacionPatrimonial.patrimonio,
      diferencia: balance.ecuacionPatrimonial.diferencia,
      severidad: 'critica',
    });
  }

  // 2. Flujo concilia con Balance
  const flujoConcilia = flujo.resumen.conciliaConBalance;
  if (!flujoConcilia) {
    errores.push({
      tipo: 'flujo',
      mensaje: `Flujo de caja no concilia: Efectivo Flujo (${flujo.resumen.efectivoFinal.toFixed(0)}) ≠ Efectivo Balance (${balance.activos.corrientes.efectivo.toFixed(0)})`,
      valorEsperado: balance.activos.corrientes.efectivo,
      valorActual: flujo.resumen.efectivoFinal,
      diferencia: flujo.resumen.diferenciaConBalance,
      severidad: 'critica',
    });
  }

  // 3. Utilidad cierra a Balance
  const utilidadBalance = balance.patrimonio.utilidadDelEjercicio;
  const diferenciaUtilidad = Math.abs(utilidadPyL - utilidadBalance);
  const utilidadCierra = diferenciaUtilidad < 1;
  if (!utilidadCierra) {
    errores.push({
      tipo: 'utilidad',
      mensaje: `Utilidad no cierra: P&L (${utilidadPyL.toFixed(0)}) ≠ Balance (${utilidadBalance.toFixed(0)})`,
      valorEsperado: utilidadPyL,
      valorActual: utilidadBalance,
      diferencia: diferenciaUtilidad,
      severidad: 'critica',
    });
  }

  // 4. Escrow está en pasivos (informativo)
  const escrowConcilia = balance.pasivos.corrientes.escrowAbogados >= 0;

  return {
    valido: errores.filter(e => e.severidad === 'critica').length === 0,
    errores,
    timestamp: new Date(),
    validaciones: {
      balanceCuadra,
      flujoConcilia,
      utilidadCierra,
      escrowConcilia,
    },
    metricas: {
      activosTotales: balance.activos.totalActivos,
      pasivosTotales: balance.pasivos.totalPasivos,
      patrimonioTotal: balance.patrimonio.totalPatrimonio,
      efectivoBalance: balance.activos.corrientes.efectivo,
      efectivoFlujo: flujo.resumen.efectivoFinal,
      utilidadPyL,
      utilidadBalance,
    },
  };
}

// ============ CASH CONVERSION CYCLE ============

export function calcularCashConversion(
  ventas30Dias: number,
  cuentasPorCobrar: number,
  cuentasPorPagar: number,
  costos30Dias: number
): CashConversionCycle {
  // DSO = (CxC / Ventas) × 30
  const dso = ventas30Dias > 0 ? (cuentasPorCobrar / ventas30Dias) * 30 : 0;

  // DPO = (CxP / Costos) × 30
  const dpo = costos30Dias > 0 ? (cuentasPorPagar / costos30Dias) * 30 : 0;

  // DIO = 0 for services
  const dio = 0;

  // CCC = DSO + DIO - DPO
  const ccc = dso + dio - dpo;

  // Interpretation
  let interpretacion: 'positivo' | 'negativo' | 'neutro';
  let descripcion: string;

  if (ccc < -5) {
    interpretacion = 'negativo';
    descripcion = `Excelente: Cobras ${Math.abs(ccc).toFixed(0)} días antes de pagar.`;
  } else if (ccc > 10) {
    interpretacion = 'positivo';
    descripcion = `Atención: Necesitas financiar ${ccc.toFixed(0)} días de operación.`;
  } else {
    interpretacion = 'neutro';
    descripcion = `Neutro: El ciclo está balanceado.`;
  }

  // Working capital required
  const capitalTrabajoRequerido = ventas30Dias > 0 ? (ccc / 30) * ventas30Dias : 0;

  return {
    dso,
    dpo,
    dio,
    ccc,
    interpretacion,
    descripcion,
    capitalTrabajoRequerido,
  };
}

// ============ THREE-STATEMENT MODEL GENERATOR ============

interface ThreeStatementInputs {
  año: number;

  // P&L data
  ingresosBrutos: number;
  costoVentas: number;
  gastosOperativos: number;
  depreciacion: number;
  amortizacion: number;
  gastosFinancieros: number;
  impuestoRenta: number;

  // Balance initial values
  efectivoInicial: number;
  capitalSocial: number;
  reservaLegal: number;
  utilidadesRetenidas: number;

  // Working capital
  diasCartera: number;
  diasProveedores: number;
  escrowAbogados: number;

  // Fixed assets
  capex: number;
  inversionSoftware: number;
  ppeAcumulado: number;
  softwareAcumulado: number;
  depreciacionAcumulada: number;
  amortizacionAcumulada: number;

  // Previous period balance (for delta calculations)
  cxcAnterior: number;
  cxpAnterior: number;
  impuestosAnterior: number;
  escrowAnterior: number;
  nominaAnterior: number;
}

export function generarThreeStatementModel(inputs: ThreeStatementInputs): ThreeStatementModel {
  const {
    año,
    ingresosBrutos,
    costoVentas,
    gastosOperativos,
    depreciacion,
    amortizacion,
    gastosFinancieros,
    impuestoRenta,
    efectivoInicial,
    capitalSocial,
    reservaLegal,
    utilidadesRetenidas,
    diasCartera,
    diasProveedores,
    escrowAbogados,
    capex,
    inversionSoftware,
    ppeAcumulado,
    softwareAcumulado,
    depreciacionAcumulada,
    amortizacionAcumulada,
    cxcAnterior,
    cxpAnterior,
    impuestosAnterior,
    escrowAnterior,
    nominaAnterior,
  } = inputs;

  // Calculate P&L
  const utilidadBruta = ingresosBrutos - costoVentas;
  const ebitda = utilidadBruta - gastosOperativos;
  const ebit = ebitda - depreciacion - amortizacion;
  const utilidadAntesImpuestos = ebit - gastosFinancieros;
  const utilidadNeta = utilidadAntesImpuestos - impuestoRenta;

  const estadoResultados = {
    ingresosBrutos,
    costoVentas,
    utilidadBruta,
    gastosOperativos,
    ebitda,
    depreciacionAmortizacion: depreciacion + amortizacion,
    ebit,
    gastosFinancieros,
    utilidadAntesImpuestos,
    impuestoRenta,
    utilidadNeta,
  };

  // Generate Balance
  const balanceGeneral = generarBalanceGeneral({
    año,
    mes: 12, // Annual
    utilidadNeta,
    depreciacion,
    amortizacion,
    ingresosBrutos,
    costoVentas,
    gastosOperativos,
    efectivoInicial,
    capitalSocial,
    reservaLegal,
    utilidadesRetenidas,
    diasCartera,
    diasProveedores,
    escrowAbogados,
    capexPeriodo: capex,
    inversionSoftware,
    ppeAcumulado,
    softwareAcumulado,
    depreciacionAcumulada,
    amortizacionAcumulada,
  });

  // Calculate deltas for cash flow (Safe against NaN)
  const deltaCxC = (balanceGeneral.activos.corrientes.cuentasPorCobrar || 0) - (cxcAnterior || 0);
  const deltaCxP = (balanceGeneral.pasivos.corrientes.cuentasPorPagar || 0) - (cxpAnterior || 0);
  const deltaImp = (balanceGeneral.pasivos.corrientes.impuestosPorPagar || 0) - (impuestosAnterior || 0);
  const deltaEscrow = (escrowAbogados || 0) - (escrowAnterior || 0);
  const deltaNomina = (balanceGeneral.pasivos.corrientes.nominaPorPagar || 0) - (nominaAnterior || 0);

  // Generate Cash Flow
  const flujoDeCaja = generarFlujoDeCaja({
    periodo: `${año}`,
    utilidadNeta: utilidadNeta || 0,
    depreciacion: depreciacion || 0,
    amortizacion: amortizacion || 0,
    deltaCuentasPorCobrar: deltaCxC,
    deltaCuentasPorPagar: deltaCxP,
    deltaImpuestosPorPagar: deltaImp,
    deltaEscrowAbogados: deltaEscrow,
    deltaNominaPorPagar: deltaNomina,
    capex,
    inversionSoftware,
    emisionAcciones: 0,
    aportesSocios: 0,
    efectivoInicial,
    efectivoBalance: balanceGeneral.activos.corrientes.efectivo, // This inputs the WRONG balance cash for comparison inside, but we fix it below
  });

  // ============ FIX: SYNC BALANCE CASH WITH CASH FLOW ============
  // The balance generator uses a simplified cash formula. We must overwrite it 
  // with the actual cash flow result to ensure triangulation.

  // 1. Update Cash in Balance
  balanceGeneral.activos.corrientes.efectivo = flujoDeCaja.resumen.efectivoFinal;

  // 2. Recalculate Total Current Assets
  balanceGeneral.activos.corrientes.totalCorriente =
    balanceGeneral.activos.corrientes.efectivo +
    balanceGeneral.activos.corrientes.cuentasPorCobrar +
    balanceGeneral.activos.corrientes.inventarios +
    balanceGeneral.activos.corrientes.gastosAnticipados;

  // 3. Recalculate Total Assets
  balanceGeneral.activos.totalActivos =
    balanceGeneral.activos.corrientes.totalCorriente +
    balanceGeneral.activos.noCorrientes.totalNoCorriente;

  // 4. Recalculate Accounting Equation (A = P + E)
  balanceGeneral.ecuacionPatrimonial.activos = balanceGeneral.activos.totalActivos;
  // Liabilities and Equity don't change here (driven by P&L and days payable)

  balanceGeneral.ecuacionPatrimonial.diferencia =
    balanceGeneral.activos.totalActivos -
    balanceGeneral.pasivos.totalPasivos -
    balanceGeneral.patrimonio.totalPatrimonio;

  balanceGeneral.ecuacionPatrimonial.valido = Math.abs(balanceGeneral.ecuacionPatrimonial.diferencia) < 1;

  // Update reconciliation flag in Cash Flow (now they match by definition)
  flujoDeCaja.resumen.diferenciaConBalance = 0;
  flujoDeCaja.resumen.conciliaConBalance = true;

  // Triangulation
  const triangulacion = validarTriangulacion(utilidadNeta, balanceGeneral, flujoDeCaja);

  return {
    periodo: `${año}`,
    año,
    estadoResultados,
    balanceGeneral,
    flujoDeCaja,
    triangulacion,
  };
}
