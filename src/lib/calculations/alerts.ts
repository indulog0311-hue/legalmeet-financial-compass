import { Alerta, UnitEconomics, BalanceGeneral, KPIsSaaS } from '@/types';
import { BENCHMARKS } from '@/lib/constants/benchmarks';
import { v4 as uuidv4 } from 'uuid';

export function detectarAlertas(
  unitEconomics: UnitEconomics | null,
  balance: BalanceGeneral | null,
  kpis: KPIsSaaS | null,
  flujoNegativoMeses: number
): Alerta[] {
  const alertas: Alerta[] = [];
  
  // 1. Runway Crítico
  if (kpis && kpis.runway_meses < BENCHMARKS.RUNWAY_MINIMO_MESES) {
    alertas.push({
      id: uuidv4(),
      severidad: 'CRITICA',
      categoria: 'Liquidez',
      titulo: 'Runway Crítico: Menos de 6 Meses',
      descripcion: `Con burn rate actual, solo quedan ${kpis.runway_meses.toFixed(1)} meses de operación.`,
      valor_actual: kpis.runway_meses,
      benchmark: BENCHMARKS.RUNWAY_MINIMO_MESES,
      accion_recomendada: 'URGENTE: Activar ronda de financiación o reducir burn 40%',
      fecha: new Date()
    });
  }
  
  // 2. LTV/CAC Insostenible
  if (unitEconomics && unitEconomics.ltv_cac_ratio > 0 && unitEconomics.ltv_cac_ratio < BENCHMARKS.LTV_CAC_MINIMO) {
    alertas.push({
      id: uuidv4(),
      severidad: 'CRITICA',
      categoria: 'Eficiencia',
      titulo: 'LTV/CAC < 3.0 - Unit Economics No Sostenibles',
      descripcion: `Ratio actual: ${unitEconomics.ltv_cac_ratio.toFixed(2)}. Cada cliente adquirido destruye valor.`,
      valor_actual: unitEconomics.ltv_cac_ratio,
      benchmark: BENCHMARKS.LTV_CAC_MINIMO,
      accion_recomendada: 'Reducir CAC 40% o aumentar LTV (upsell, reducir churn)',
      fecha: new Date()
    });
  }
  
  // 3. Balance Descuadrado
  if (balance && !balance.ecuacion_valida) {
    alertas.push({
      id: uuidv4(),
      severidad: 'CRITICA',
      categoria: 'Rentabilidad',
      titulo: 'Balance General Descuadrado',
      descripcion: `Diferencia de $${balance.diferencia.toLocaleString('es-CO')} en ecuación patrimonial.`,
      valor_actual: balance.diferencia,
      benchmark: 1,
      accion_recomendada: 'Revisar cálculos de activos, pasivos y patrimonio',
      fecha: new Date()
    });
  }
  
  // 4. Churn Alarmante
  if (unitEconomics && unitEconomics.churn_mensual > BENCHMARKS.CHURN_MAXIMO) {
    alertas.push({
      id: uuidv4(),
      severidad: 'ALTA',
      categoria: 'Eficiencia',
      titulo: 'Churn Mensual Elevado',
      descripcion: `Churn actual: ${(unitEconomics.churn_mensual * 100).toFixed(1)}% (máximo recomendado: 7%)`,
      valor_actual: unitEconomics.churn_mensual * 100,
      benchmark: BENCHMARKS.CHURN_MAXIMO * 100,
      accion_recomendada: 'Implementar programa de retención y mejorar NPS',
      fecha: new Date()
    });
  }
  
  // 5. CAC Elevado
  if (unitEconomics && unitEconomics.cac > BENCHMARKS.CAC_MAXIMO) {
    alertas.push({
      id: uuidv4(),
      severidad: 'ALTA',
      categoria: 'Eficiencia',
      titulo: 'CAC Superior al Benchmark',
      descripcion: `CAC actual: $${unitEconomics.cac.toLocaleString('es-CO')} (máximo: $100.000)`,
      valor_actual: unitEconomics.cac,
      benchmark: BENCHMARKS.CAC_MAXIMO,
      accion_recomendada: 'Optimizar canales de adquisición, mejorar conversión',
      fecha: new Date()
    });
  }
  
  // 6. Flujo Negativo Consecutivo
  if (flujoNegativoMeses >= 3) {
    alertas.push({
      id: uuidv4(),
      severidad: 'ALTA',
      categoria: 'Liquidez',
      titulo: 'Flujo de Caja Negativo Persistente',
      descripcion: `${flujoNegativoMeses} meses consecutivos con flujo operativo negativo.`,
      valor_actual: flujoNegativoMeses,
      benchmark: 2,
      accion_recomendada: 'Revisar estructura de costos y acelerar cobranza',
      fecha: new Date()
    });
  }
  
  // Ordenar por severidad
  const orden = { 'CRITICA': 0, 'ALTA': 1, 'MEDIA': 2 };
  return alertas.sort((a, b) => orden[a.severidad] - orden[b.severidad]);
}
