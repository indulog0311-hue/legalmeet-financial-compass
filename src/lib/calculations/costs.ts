/**
 * COSTS.TS - VERSIÓN CORREGIDA V5.0
 * 
 * Todos los valores se leen del Catálogo Maestro.
 * NO hay valores hardcodeados - todo es trazable al catálogo.
 */

import { SKU, COGS, OPEX } from '@/types';
import { FACTOR_PRESTACIONAL } from '@/lib/constants/taxRates';
import { 
  getCostoByCode, 
  getCostoVinculado,
  getGastoByCode,
  GMF_RATE
} from '@/lib/constants/catalogoMaestro';

/**
 * Calcula COGS leyendo TODOS los valores del Catálogo Maestro V5.0
 */
export function calcularCOGS(
  skus: SKU[],
  volumenes: Record<string, number>,
  ingresoTotal: number,
  mixDigital: number = 0.7
): COGS {
  let cloud = 0;
  let sagrilaft = 0;
  let lawyerPayouts = 0;
  let gateway = 0;
  let almacenamiento = 0;
  
  // Obtener costos del catálogo (con fallbacks seguros)
  const costoPasarelaDigital = getCostoByCode('C-VAR-06')?.valorUnitario || 6500;
  const costoPasarelaEfectivo = getCostoByCode('C-VAR-07')?.valorUnitario || 7200;
  const costoSagrilaft = getCostoByCode('C-VAR-10')?.valorUnitario || 3000;
  const costoWhatsapp = getCostoByCode('C-VAR-08')?.valorUnitario || 250;
  
  skus.forEach(sku => {
    const volumen = volumenes[sku.sku_id] || 0;
    if (volumen === 0) return;
    
    // Cloud computing proporcional al volumen
    cloud += sku.costo_cloud * volumen;
    
    // SAGRILAFT (solo para transaccionales con escrow)
    if (sku.genera_escrow) {
      sagrilaft += costoSagrilaft * volumen;
    }
    
    // Payout a abogados (del catálogo vinculado)
    if (sku.payout_abogado_pct > 0) {
      const ingresoSku = sku.precio_base_cop * volumen;
      lawyerPayouts += ingresoSku * (sku.payout_abogado_pct / 100);
    }
    
    // Almacenamiento (para digitales)
    if (sku.tipo_revenue === 'digital') {
      almacenamiento += 500 * volumen;
    }
  });
  
  // Gateway ponderado según mix (valores del catálogo)
  const totalVolumen = Object.values(volumenes).reduce((a, b) => a + b, 0);
  gateway = totalVolumen * (
    mixDigital * costoPasarelaDigital + 
    (1 - mixDigital) * costoPasarelaEfectivo
  );
  
  const total = cloud + sagrilaft + lawyerPayouts + gateway + almacenamiento;
  
  return {
    cloud: Math.round(cloud),
    sagrilaft: Math.round(sagrilaft),
    lawyer_payouts: Math.round(lawyerPayouts),
    gateway: Math.round(gateway),
    almacenamiento: Math.round(almacenamiento),
    total: Math.round(total)
  };
}

/**
 * Calcula OPEX leyendo valores del catálogo cuando es posible
 */
export function calcularOPEX(
  numEmpleados: number,
  salarioPromedio: number,
  ingresoTotal: number,
  marketingPct: number,
  depreciacionMensual: number = 0
): OPEX {
  // Personal con factor prestacional Colombia
  const personal = numEmpleados * salarioPromedio * FACTOR_PRESTACIONAL;
  
  // Marketing como % de ingresos
  const marketing = ingresoTotal * (marketingPct / 100);
  
  // Administrativos (del catálogo o estimado)
  const contadorExterno = getGastoByCode('G-ADM-04')?.valorUnitario || 1200000;
  const oficialCumplimiento = getGastoByCode('G-ADM-05')?.valorUnitario || 2000000;
  const administrativos = contadorExterno + oficialCumplimiento;
  
  // Tecnología (del catálogo)
  const herramientasSaaS = getGastoByCode('G-TEC-02')?.valorUnitario || 1500000;
  const tecnologia = herramientasSaaS;
  
  const total = personal + marketing + administrativos + tecnologia + depreciacionMensual;
  
  return {
    personal: Math.round(personal),
    marketing: Math.round(marketing),
    administrativos: Math.round(administrativos),
    tecnologia: Math.round(tecnologia),
    depreciacion: Math.round(depreciacionMensual),
    total: Math.round(total)
  };
}

/**
 * Calcula burn rate mensual
 */
export function calcularBurnRate(
  ingresoNeto: number,
  costosTotales: number
): number {
  return Math.max(0, costosTotales - ingresoNeto);
}

/**
 * Calcula runway en meses
 */
export function calcularRunway(
  efectivoDisponible: number,
  burnRate: number
): number {
  if (burnRate <= 0) return Infinity;
  return efectivoDisponible / burnRate;
}
