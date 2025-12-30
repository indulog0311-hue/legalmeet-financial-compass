/**
 * VALIDATION SCHEMAS V1.0
 * Zod schemas for input validation across the application
 * 
 * All user inputs should be validated using these schemas.
 */

import { z } from 'zod';
import { IMPUESTOS, PROYECCION, MULTIPLICADORES } from '@/lib/constants/financialConstants';

// ============ PRIMITIVE VALIDATORS ============

/**
 * Positive number (>= 0)
 */
export const positiveNumber = z.number().min(0, 'Debe ser mayor o igual a 0');

/**
 * Percentage between 0 and 1
 */
export const percentage = z.number()
  .min(0, 'Debe ser mayor o igual a 0%')
  .max(1, 'Debe ser menor o igual a 100%');

/**
 * Percentage between 0 and 100 (display format)
 */
export const percentageDisplay = z.number()
  .min(0, 'Debe ser mayor o igual a 0%')
  .max(100, 'Debe ser menor o igual a 100%');

/**
 * Valid year for projection
 */
export const proyectionYear = z.number()
  .int('Debe ser un año entero')
  .min(PROYECCION.AÑO_INICIO, `Año mínimo: ${PROYECCION.AÑO_INICIO}`)
  .max(PROYECCION.AÑO_FIN, `Año máximo: ${PROYECCION.AÑO_FIN}`);

/**
 * Valid month (1-12)
 */
export const month = z.number()
  .int('Debe ser un mes entero')
  .min(1, 'Mes mínimo: 1')
  .max(12, 'Mes máximo: 12');

// ============ CONFIGURATION SCHEMA ============

/**
 * Main configuration schema for the simulator
 */
export const ConfiguracionSchema = z.object({
  /** Initial monthly volume per SKU */
  volumenMensualInicial: z.number()
    .int('Debe ser un número entero')
    .min(0, 'Volumen mínimo: 0')
    .max(1000000, 'Volumen máximo: 1,000,000'),
  
  /** Monthly growth rate (0-1) */
  crecimientoMensual: percentage
    .default(MULTIPLICADORES.CRECIMIENTO_MENSUAL_DEFAULT),
  
  /** Average price per consultation in COP */
  precioPromedioConsulta: z.number()
    .min(0, 'Precio mínimo: $0')
    .max(100000000, 'Precio máximo: $100,000,000'),
  
  /** Digital payment mix (0-1) */
  mixDigital: percentage
    .default(0.70),
  
  /** Rural/cash payment mix (0-1) */
  mixRural: percentage
    .default(0.30),
  
  /** Monthly churn rate (0-1) */
  churnMensual: percentage
    .default(MULTIPLICADORES.CHURN_MENSUAL_DEFAULT),
  
  /** Initial capital in COP */
  capitalInicial: z.number()
    .min(0, 'Capital mínimo: $0'),
  
  /** Projection year */
  añoProyeccion: proyectionYear
    .default(PROYECCION.AÑO_INICIO),
  
  /** Number of employees */
  numEmpleados: z.number()
    .int('Debe ser un número entero')
    .min(0, 'Mínimo: 0 empleados')
    .max(1000, 'Máximo: 1000 empleados')
    .default(3),
  
  /** Average salary in COP */
  salarioPromedio: z.number()
    .min(0, 'Salario mínimo: $0')
    .max(100000000, 'Salario máximo: $100,000,000')
    .default(5000000),
  
  /** Marketing spend as percentage of revenue */
  marketingPct: percentageDisplay
    .default(15),
  
  /** Customer Acquisition Cost in COP */
  cac: z.number()
    .min(0, 'CAC mínimo: $0')
    .default(100000),
}).refine(
  (data) => data.mixDigital + data.mixRural <= 1.01,
  { message: 'Mix digital + rural no puede exceder 100%', path: ['mixRural'] }
);

export type Configuracion = z.infer<typeof ConfiguracionSchema>;

// ============ TAX SIMULATOR SCHEMA ============

/**
 * Tax simulator configuration schema
 */
export const TaxSimulatorSchema = z.object({
  tasaRenta: percentageDisplay
    .default(IMPUESTOS.TASA_RENTA * 100),
  
  tasaIVA: percentageDisplay
    .default(IMPUESTOS.IVA * 100),
  
  tasaICA: z.number()
    .min(0)
    .max(5)
    .default(IMPUESTOS.ICA_BOGOTA * 100),
  
  tasaGMF: z.number()
    .min(0)
    .max(1)
    .default(IMPUESTOS.GMF * 100),
  
  sobretasa: percentageDisplay
    .default(0),
  
  tasaPasarela: percentageDisplay
    .default(2.9),
  
  factorParafiscales: z.number()
    .min(1)
    .max(2)
    .default(1.52),
});

export type TaxSimulatorConfig = z.infer<typeof TaxSimulatorSchema>;

// ============ VOLUME SCHEMA ============

/**
 * SKU volume input schema
 */
export const VolumeInputSchema = z.object({
  skuId: z.string().min(1, 'SKU ID requerido'),
  mes: month,
  año: proyectionYear,
  volumen: z.number()
    .int('Debe ser un número entero')
    .min(0, 'Volumen mínimo: 0')
    .max(10000000, 'Volumen máximo: 10,000,000'),
});

export type VolumeInput = z.infer<typeof VolumeInputSchema>;

// ============ MACRO PARAMETERS SCHEMA ============

/**
 * Macroeconomic parameters schema
 */
export const ParametrosMacroSchema = z.object({
  año: proyectionYear,
  inflacion_pct: z.number().min(0).max(50),
  trm: z.number().min(1000).max(10000),
  tasa_renta_pct: z.number().min(0).max(100),
  tasa_iva_pct: z.number().min(0).max(100),
  tasa_banrep_pct: z.number().min(0).max(50),
});

export type ParametrosMacro = z.infer<typeof ParametrosMacroSchema>;

// ============ HELPER FUNCTIONS ============

/**
 * Validates configuration and returns typed result
 */
export function validarConfiguracion(data: unknown): {
  success: boolean;
  data?: Configuracion;
  errors?: string[];
} {
  const result = ConfiguracionSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
  };
}

/**
 * Sanitizes a numeric input value
 */
export function sanitizarNumero(valor: unknown, defaultValue = 0): number {
  if (typeof valor === 'number' && Number.isFinite(valor)) {
    return valor;
  }
  
  if (typeof valor === 'string') {
    // Remove currency formatting and parse
    const cleaned = valor.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }
  
  return defaultValue;
}

/**
 * Sanitizes a percentage input (handles both 0-1 and 0-100 formats)
 */
export function sanitizarPorcentaje(valor: unknown, asDecimal = true): number {
  const num = sanitizarNumero(valor, 0);
  
  // If value is > 1, assume it's in 0-100 format
  if (num > 1 && asDecimal) {
    return Math.min(num / 100, 1);
  }
  
  // If value is <= 1 and we want percentage display
  if (num <= 1 && !asDecimal) {
    return num * 100;
  }
  
  return Math.min(Math.max(num, 0), asDecimal ? 1 : 100);
}

/**
 * Validates and clamps a value within bounds
 */
export function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
