import { ParametrosMacro } from '@/types';

// Factor prestacional Colombia (52% sobre salario base)
export const FACTOR_PRESTACIONAL = 1.52;

// Componentes del factor prestacional
export const PRESTACIONES_COLOMBIA = {
  salud_empleador: 0.085,      // 8.5%
  pension_empleador: 0.12,     // 12%
  arl_riesgo_1: 0.00522,       // 0.522% (riesgo bajo)
  caja_compensacion: 0.04,     // 4%
  sena: 0.02,                  // 2%
  icbf: 0.03,                  // 3%
  cesantias: 0.0833,           // 8.33%
  intereses_cesantias: 0.01,   // 1%
  prima: 0.0833,               // 8.33%
  vacaciones: 0.0417           // 4.17%
};

// Tasas de retención en la fuente
export const RETENCIONES = {
  servicios_profesionales: 0.11, // 11%
  servicios_generales: 0.04,     // 4%
  compras: 0.025                 // 2.5%
};

// ICA Bogotá (por mil)
export const ICA_BOGOTA = {
  servicios_juridicos: 9.66,
  software: 11.04
};

// Parámetros macro por año
export const PARAMETROS_MACRO: ParametrosMacro[] = [
  { año: 2026, inflacion_pct: 4.5, trm: 4200, tasa_renta_pct: 35, tasa_iva_pct: 19, tasa_banrep_pct: 9.0 },
  { año: 2027, inflacion_pct: 4.0, trm: 4300, tasa_renta_pct: 35, tasa_iva_pct: 19, tasa_banrep_pct: 8.0 },
  { año: 2028, inflacion_pct: 3.5, trm: 4350, tasa_renta_pct: 35, tasa_iva_pct: 19, tasa_banrep_pct: 7.5 },
  { año: 2029, inflacion_pct: 3.2, trm: 4400, tasa_renta_pct: 35, tasa_iva_pct: 19, tasa_banrep_pct: 7.0 },
  { año: 2030, inflacion_pct: 3.0, trm: 4450, tasa_renta_pct: 35, tasa_iva_pct: 19, tasa_banrep_pct: 6.5 },
  { año: 2031, inflacion_pct: 3.0, trm: 4500, tasa_renta_pct: 35, tasa_iva_pct: 19, tasa_banrep_pct: 6.0 }
];

export const getParametrosByAño = (año: number): ParametrosMacro | undefined =>
  PARAMETROS_MACRO.find(p => p.año === año);
