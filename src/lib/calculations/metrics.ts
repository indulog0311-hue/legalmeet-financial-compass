/**
 * METRICS.TS - Centralized Financial Metrics
 * 
 * Eliminates duplicate burnRate/runway calculations across Dashboard and KPIs.
 * All metric calculations should use this module.
 */

export interface BurnRateResult {
  burnRateMensual: number;
  runway: number;
  estado: 'critico' | 'alerta' | 'saludable';
}

export interface MargenesResult {
  margenBruto: number;
  margenEBITDA: number;
  margenNeto: number;
}

export interface UnitEconomicsSimple {
  ltv: number;
  cac: number;
  ltvCacRatio: number;
  paybackMeses: number;
}

/**
 * Runway thresholds in months
 */
export const RUNWAY_THRESHOLDS = {
  CRITICO: 6,
  ALERTA: 12,
  SALUDABLE: 18,
  INFINITO: 999,
} as const;

/**
 * Calcula burn rate mensual
 * Burn = max(0, Costos - Ingresos)
 */
export function calcularBurnRate(
  ingresoNeto: number,
  costosTotales: number
): number {
  return Math.max(0, costosTotales - ingresoNeto);
}

/**
 * Calcula runway en meses
 * Runway = Capital / Burn Rate
 */
export function calcularRunway(
  capitalDisponible: number,
  burnRateMensual: number
): number {
  if (burnRateMensual <= 0) return RUNWAY_THRESHOLDS.INFINITO;
  return capitalDisponible / burnRateMensual;
}

/**
 * Determina el estado de salud basado en runway
 */
export function determinarEstadoRunway(
  runway: number
): 'critico' | 'alerta' | 'saludable' {
  if (runway < RUNWAY_THRESHOLDS.CRITICO) return 'critico';
  if (runway < RUNWAY_THRESHOLDS.ALERTA) return 'alerta';
  return 'saludable';
}

/**
 * Calcula burn rate completo con estado de salud
 * Esta es la función principal que reemplaza el código duplicado
 */
export function calcularBurnRateCompleto(params: {
  ingresosMensuales: number;
  costosMensuales: number;
  capitalDisponible: number;
}): BurnRateResult {
  const { ingresosMensuales, costosMensuales, capitalDisponible } = params;
  
  const burnMensual = calcularBurnRate(ingresosMensuales, costosMensuales);
  const runway = calcularRunway(capitalDisponible, burnMensual);
  const estado = determinarEstadoRunway(runway);
  
  return {
    burnRateMensual: burnMensual,
    runway: Math.min(runway, RUNWAY_THRESHOLDS.INFINITO),
    estado,
  };
}

/**
 * Calcula márgenes de rentabilidad
 */
export function calcularMargenes(params: {
  ingresos: number;
  cogs: number;
  opex: number;
  depreciacion?: number;
  impuestos?: number;
}): MargenesResult {
  const { ingresos, cogs, opex, depreciacion = 0, impuestos = 0 } = params;
  
  if (ingresos === 0) {
    return { margenBruto: 0, margenEBITDA: 0, margenNeto: 0 };
  }
  
  const utilidadBruta = ingresos - cogs;
  const ebitda = utilidadBruta - opex;
  const utilidadNeta = ebitda - depreciacion - impuestos;
  
  return {
    margenBruto: (utilidadBruta / ingresos) * 100,
    margenEBITDA: (ebitda / ingresos) * 100,
    margenNeto: (utilidadNeta / ingresos) * 100,
  };
}

/**
 * Calcula Unit Economics simplificado
 */
export function calcularUnitEconomicsSimple(params: {
  arpu: number;
  churnMensual: number;
  cac: number;
}): UnitEconomicsSimple {
  const { arpu, churnMensual, cac } = params;
  
  // Protección contra división por cero
  if (churnMensual <= 0 || churnMensual >= 1 || arpu <= 0) {
    return {
      ltv: 0,
      cac,
      ltvCacRatio: 0,
      paybackMeses: 0,
    };
  }
  
  const lifespan = 1 / churnMensual;
  const ltv = arpu * lifespan;
  const ltvCacRatio = cac > 0 ? ltv / cac : 0;
  const paybackMeses = arpu > 0 ? cac / arpu : 0;
  
  return {
    ltv,
    cac,
    ltvCacRatio,
    paybackMeses,
  };
}

/**
 * Evalúa si LTV/CAC ratio es saludable
 */
export function evaluarLtvCac(ratio: number): 'excelente' | 'bueno' | 'alerta' | 'critico' {
  if (ratio >= 5) return 'excelente';
  if (ratio >= 3) return 'bueno';
  if (ratio >= 1) return 'alerta';
  return 'critico';
}

/**
 * Calcula gross-up para retención en la fuente
 * Base = ValorNeto / (1 - TasaRetencion)
 */
export function calcularGrossUp(valorNeto: number, tasaRetencion: number): {
  baseGravable: number;
  retencion: number;
  totalAPagar: number;
} {
  if (tasaRetencion >= 1 || tasaRetencion < 0) {
    return { baseGravable: valorNeto, retencion: 0, totalAPagar: valorNeto };
  }
  
  const baseGravable = valorNeto / (1 - tasaRetencion);
  const retencion = baseGravable * tasaRetencion;
  
  return {
    baseGravable: Math.round(baseGravable),
    retencion: Math.round(retencion),
    totalAPagar: Math.round(baseGravable),
  };
}
