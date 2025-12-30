import { SKU, IngresoMensual, UnitEconomics, ParametrosMacro } from '@/types';
import { getParametrosByAño, PARAMETROS_MACRO } from '@/lib/constants/taxRates';
import { BENCHMARKS } from '@/lib/constants/benchmarks';

/**
 * Calcula el precio indexado por inflación
 */
export function calcularPrecioIndexado(
  precioBase: number,
  añoBase: number,
  añoActual: number
): number {
  let precio = precioBase;
  for (let año = añoBase; año < añoActual; año++) {
    const params = getParametrosByAño(año);
    if (params) {
      precio *= (1 + params.inflacion_pct / 100);
    }
  }
  return Math.round(precio);
}

/**
 * Calcula ingreso mensual por SKU
 */
export function calcularIngresoMensual(
  sku: SKU,
  mes: number,
  año: number,
  volumen: number
): IngresoMensual {
  const precioIndexado = calcularPrecioIndexado(sku.precio_base_cop, 2026, año);
  
  const ingresoBruto = volumen * precioIndexado;
  const iva = sku.aplica_iva ? ingresoBruto * (sku.tasa_iva / 100) : 0;
  const ingresoNeto = ingresoBruto - iva;
  
  return {
    sku_id: sku.sku_id,
    mes,
    año,
    volumen,
    precio_unitario: precioIndexado,
    ingreso_bruto: ingresoBruto,
    iva,
    ingreso_neto: ingresoNeto
  };
}

/**
 * Calcula Unit Economics
 */
export function calcularUnitEconomics(
  cac: number,
  arpu: number,
  churnMensual: number
): UnitEconomics {
  if (cac <= 0 || arpu <= 0 || churnMensual <= 0 || churnMensual >= 1) {
    return {
      cac: 0,
      arpu_mensual: 0,
      churn_mensual: 0,
      lifespan_meses: 0,
      ltv: 0,
      ltv_cac_ratio: 0,
      payback_months: 0
    };
  }
  
  const lifespanMeses = 1 / churnMensual;
  const ltv = arpu * lifespanMeses;
  const ltvCacRatio = ltv / cac;
  const paybackMonths = cac / arpu;
  
  return {
    cac,
    arpu_mensual: arpu,
    churn_mensual: churnMensual,
    lifespan_meses: lifespanMeses,
    ltv,
    ltv_cac_ratio: ltvCacRatio,
    payback_months: paybackMonths
  };
}

/**
 * Calcula ARPU basado en ingresos totales
 */
export function calcularARPU(
  ingresosTotales: number,
  usuariosActivos: number
): number {
  if (usuariosActivos === 0) return 0;
  return ingresosTotales / usuariosActivos;
}

/**
 * Calcula MRR y ARR
 */
export function calcularMRR(
  ingresosRecurrentes: number[]
): { mrr: number; arr: number } {
  const mrr = ingresosRecurrentes.reduce((sum, ing) => sum + ing, 0);
  return {
    mrr,
    arr: mrr * 12
  };
}
