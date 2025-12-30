// Benchmarks para alertas y validaciones
export const BENCHMARKS = {
  // Unit Economics
  LTV_CAC_MINIMO: 3.0,
  CAC_MAXIMO: 100000,
  CHURN_MAXIMO: 0.07, // 7%
  ARPU_MINIMO: 50000,
  
  // Liquidez
  RUNWAY_MINIMO_MESES: 6,
  LIQUIDEZ_CORRIENTE_MINIMA: 1.0,
  PRUEBA_ACIDA_MINIMA: 1.0,
  
  // Rentabilidad
  MARGEN_BRUTO_MINIMO: 0.40, // 40%
  MARGEN_EBITDA_OBJETIVO: 0.20, // 20%
  
  // Crecimiento
  GROWTH_RATE_MINIMO: 0.20, // 20% YoY
  RULE_OF_40_OBJETIVO: 40,
  
  // Operacional
  NPS_MINIMO: 30,
  SLA_MINIMO: 0.90, // 90%
  
  // Riesgo
  ENDEUDAMIENTO_MAXIMO: 0.70, // 70%
  CONCENTRACION_CLIENTE_MAXIMO: 0.30 // 30%
};

export const ALERTAS_CONFIG = [
  { id: 'runway', condicion: 'runway < 6', severidad: 'CRITICA', categoria: 'Liquidez' },
  { id: 'ltv_cac', condicion: 'ltv_cac < 3.0', severidad: 'CRITICA', categoria: 'Eficiencia' },
  { id: 'burn_rate', condicion: 'burn > ingresos * 1.5', severidad: 'CRITICA', categoria: 'Liquidez' },
  { id: 'balance', condicion: 'ecuacion_invalida', severidad: 'CRITICA', categoria: 'Rentabilidad' },
  { id: 'churn', condicion: 'churn > 7%', severidad: 'ALTA', categoria: 'Eficiencia' },
  { id: 'cac', condicion: 'cac > 100000', severidad: 'ALTA', categoria: 'Eficiencia' },
  { id: 'margen_bruto', condicion: 'margen < 40%', severidad: 'ALTA', categoria: 'Rentabilidad' },
  { id: 'liquidez', condicion: 'liquidez < 1.0', severidad: 'ALTA', categoria: 'Liquidez' },
  { id: 'growth', condicion: 'growth < 20%', severidad: 'ALTA', categoria: 'Crecimiento' },
  { id: 'arpu', condicion: 'arpu_decreciente', severidad: 'MEDIA', categoria: 'Eficiencia' },
  { id: 'nps', condicion: 'nps < 30', severidad: 'MEDIA', categoria: 'Eficiencia' },
  { id: 'sla', condicion: 'sla < 90%', severidad: 'MEDIA', categoria: 'Eficiencia' },
  { id: 'concentracion', condicion: 'top_cliente > 30%', severidad: 'MEDIA', categoria: 'Rentabilidad' },
  { id: 'deuda', condicion: 'endeudamiento > 70%', severidad: 'MEDIA', categoria: 'Liquidez' },
  { id: 'flujo_negativo', condicion: 'flujo < 0 x 3 meses', severidad: 'ALTA', categoria: 'Liquidez' }
];
