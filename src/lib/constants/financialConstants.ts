/**
 * FINANCIAL CONSTANTS V1.0
 * Centralized financial constants and tax rates for LegalMeet Colombia
 * 
 * All magic numbers should be defined here with descriptive names.
 * DO NOT hardcode values in calculation files - reference this module.
 */

// ============ IMPUESTOS NACIONALES ============

/**
 * Tax rates for Colombian fiscal calculations
 */
export const IMPUESTOS = {
  /** Tasa general de impuesto de renta (35%) */
  TASA_RENTA: 0.35,
  
  /** Retención en la fuente por servicios profesionales (11%) */
  RETEFUENTE_SERVICIOS: 0.11,
  
  /** Retención en la fuente por servicios generales (4%) */
  RETEFUENTE_GENERAL: 0.04,
  
  /** Retención en la fuente por compras (2.5%) */
  RETEFUENTE_COMPRAS: 0.025,
  
  /** Gravamen a los movimientos financieros - GMF (4x1000) */
  GMF: 0.004,
  
  /** Impuesto al Valor Agregado - IVA (19%) */
  IVA: 0.19,
  
  /** Impuesto de Industria y Comercio Bogotá - servicios jurídicos (0.966%) */
  ICA_BOGOTA: 0.00966,
  
  /** Sobretasa de renta para entidades financieras (4%) */
  SOBRETASA_FINANCIERAS: 0.04,
  
  /** Reserva legal obligatoria (10% de utilidades) */
  RESERVA_LEGAL: 0.10,
} as const;

// ============ OPERACIONES ============

/**
 * Operational parameters for business calculations
 */
export const OPERACIONES = {
  /** Días hábiles promedio por año en Colombia */
  DIAS_HABILES_ANUAL: 238,
  
  /** Días hábiles promedio por mes */
  DIAS_HABILES_MES: 20,
  
  /** Meses por año */
  MESES_POR_AÑO: 12,
  
  /** Factor prestacional Colombia (salud, pensión, parafiscales, etc.) */
  FACTOR_PRESTACIONAL: 1.52,
  
  /** Días para cálculo de CxC (DSO default) */
  DIAS_CARTERA_DEFAULT: 30,
  
  /** Días para cálculo de CxP (DPO default) */
  DIAS_PROVEEDORES_DEFAULT: 45,
} as const;

// ============ BENCHMARKS SAAS ============

/**
 * Industry benchmarks for SaaS unit economics
 */
export const BENCHMARKS = {
  /** LTV/CAC mínimo aceptable */
  LTV_CAC_MINIMO: 3,
  
  /** LTV/CAC excelente */
  LTV_CAC_EXCELENTE: 5,
  
  /** Payback máximo aceptable en meses */
  PAYBACK_MAXIMO_MESES: 18,
  
  /** Payback excelente en meses */
  PAYBACK_EXCELENTE_MESES: 12,
  
  /** Churn mensual máximo B2B (5%) */
  CHURN_MAX_B2B: 0.05,
  
  /** Churn mensual excelente B2B (2%) */
  CHURN_EXCELENTE_B2B: 0.02,
  
  /** Net Revenue Retention mínimo (100%) */
  NRR_MINIMO: 1.00,
  
  /** Net Revenue Retention excelente (120%) */
  NRR_EXCELENTE: 1.20,
  
  /** Rule of 40 threshold */
  RULE_OF_40: 40,
  
  /** Margen bruto mínimo SaaS (70%) */
  MARGEN_BRUTO_MINIMO: 0.70,
  
  /** Margen EBITDA target startup (15%) */
  MARGEN_EBITDA_TARGET: 0.15,
} as const;

// ============ RUNWAY Y LIQUIDEZ ============

/**
 * Runway thresholds for cash management
 */
export const RUNWAY = {
  /** Crítico: menos de 6 meses */
  CRITICO: 6,
  
  /** Alerta: entre 6 y 12 meses */
  ALERTA: 12,
  
  /** Saludable: más de 18 meses */
  SALUDABLE: 18,
  
  /** Valor infinito (empresa rentable) */
  INFINITO: 999,
} as const;

// ============ COSTOS PASARELA ============

/**
 * Payment gateway costs
 */
export const PASARELA = {
  /** Costo por transacción digital (Wompi) en COP */
  COSTO_TX_DIGITAL: 6500,
  
  /** Costo por transacción efectivo (rural) en COP */
  COSTO_TX_EFECTIVO: 7200,
  
  /** Fee porcentual pasarela digital */
  FEE_PCT_DIGITAL: 0.029,
  
  /** Mix digital default (70%) */
  MIX_DIGITAL_DEFAULT: 0.70,
} as const;

// ============ COMUNICACIONES ============

/**
 * Communication costs
 */
export const COMUNICACIONES = {
  /** Costo WhatsApp API por conversación en COP */
  WHATSAPP_POR_CONV: 250,
  
  /** Costo SMS transaccional en COP */
  SMS_UNITARIO: 150,
  
  /** Costo SAGRILAFT por verificación en COP */
  SAGRILAFT_POR_CHECK: 3000,
} as const;

// ============ CLOUD & TECH ============

/**
 * Technology infrastructure costs
 */
export const TECH = {
  /** Costo cloud por usuario activo (MAU) en COP */
  CLOUD_POR_MAU: 400,
  
  /** Almacenamiento por documento en COP */
  ALMACENAMIENTO_POR_DOC: 500,
  
  /** SaaS tools mensual base en COP */
  SAAS_TOOLS_MENSUAL: 1500000,
} as const;

// ============ MULTIPLICADORES ============

/**
 * Multipliers for financial calculations
 */
export const MULTIPLICADORES = {
  /** GMV = Ingresos brutos × multiplicador (marketplace take rate ~40%) */
  GMV_SOBRE_REVENUE: 2.5,
  
  /** Crecimiento mensual default (10%) */
  CRECIMIENTO_MENSUAL_DEFAULT: 0.10,
  
  /** Churn mensual default (5%) */
  CHURN_MENSUAL_DEFAULT: 0.05,
  
  /** Marketing como % de ingresos default */
  MARKETING_PCT_DEFAULT: 0.15,
} as const;

// ============ AÑOS PROYECCIÓN ============

/**
 * Projection year configuration
 */
export const PROYECCION = {
  /** Año inicial de proyección */
  AÑO_INICIO: 2026,
  
  /** Año final de proyección */
  AÑO_FIN: 2031,
  
  /** Capital inicial default en COP */
  CAPITAL_INICIAL_DEFAULT: 500000000,
} as const;

// ============ TYPE EXPORTS ============

export type TasaImpuesto = keyof typeof IMPUESTOS;
export type BenchmarkKey = keyof typeof BENCHMARKS;
export type RunwayEstado = 'critico' | 'alerta' | 'saludable';
