// ============ TIPOS BASE LEGALMEET ============

export interface SKU {
  sku_id: string;
  nombre_producto: string;
  precio_base_cop: number;
  aplica_iva: boolean;
  tasa_iva: number;
  tipo_revenue: 'transaccional' | 'recurrente' | 'digital' | 'setup';
  genera_escrow: boolean;
  payout_abogado_pct: number;
  margen_target_pct: number;
  costo_cloud: number;
  costo_sagrilaft: number;
  gateway_fee_pct: number;
  activo: boolean;
}

export interface UnitEconomics {
  cac: number;
  arpu_mensual: number;
  churn_mensual: number;
  lifespan_meses: number;
  ltv: number;
  ltv_cac_ratio: number;
  payback_months: number;
}

export interface IngresoMensual {
  sku_id: string;
  mes: number;
  año: number;
  volumen: number;
  precio_unitario: number;
  ingreso_bruto: number;
  iva: number;
  ingreso_neto: number;
}

export interface COGS {
  cloud: number;
  sagrilaft: number;
  lawyer_payouts: number;
  gateway: number;
  almacenamiento: number;
  total: number;
}

export interface OPEX {
  personal: number;
  marketing: number;
  administrativos: number;
  tecnologia: number;
  depreciacion: number;
  total: number;
}

export interface EstadoResultados {
  periodo: string;
  ingresos_ordinarios: {
    por_sku: Record<string, number>;
    total: number;
  };
  costos_ventas: COGS;
  utilidad_bruta: number;
  margen_bruto_pct: number;
  gastos_operacionales: OPEX;
  ebit: number;
  ebitda: number;
  resultado_financiero: number;
  utilidad_antes_impuestos: number;
  impuesto_renta: number;
  utilidad_neta: number;
  margen_neto_pct: number;
}

export interface ActivosCorrientes {
  efectivo: number;
  cuentas_por_cobrar: number;
  total: number;
}

export interface ActivosNoCorrientes {
  software: number;
  ppe: number;
  total: number;
}

export interface PasivosCorrientes {
  cuentas_por_pagar: number;
  impuestos_por_pagar: number;
  prestaciones_sociales: number;
  total: number;
}

export interface PasivosNoCorrientes {
  deuda_largo_plazo: number;
  total: number;
}

export interface Patrimonio {
  capital: number;
  reserva_legal: number;
  resultados_acumulados: number;
  resultado_ejercicio: number;
  total: number;
}

export interface BalanceGeneral {
  periodo: string;
  activos: {
    corriente: ActivosCorrientes;
    no_corriente: ActivosNoCorrientes;
    total: number;
  };
  pasivos: {
    corriente: PasivosCorrientes;
    no_corriente: PasivosNoCorrientes;
    total: number;
  };
  patrimonio: Patrimonio;
  ecuacion_valida: boolean;
  diferencia: number;
}

export interface FlujosEfectivo {
  periodo: string;
  operacion: {
    utilidad_neta: number;
    ajustes_no_cash: {
      depreciacion: number;
      amortizacion: number;
    };
    cambios_capital_trabajo: {
      cuentas_cobrar: number;
      cuentas_pagar: number;
    };
    flujo_neto: number;
  };
  inversion: {
    capex_software: number;
    capex_ppe: number;
    flujo_neto: number;
  };
  financiacion: {
    aportes_capital: number;
    nuevos_prestamos: number;
    pago_deuda: number;
    flujo_neto: number;
  };
  efectivo: {
    saldo_inicial: number;
    variacion_neta: number;
    saldo_final: number;
  };
}

export interface Alerta {
  id: string;
  severidad: 'CRITICA' | 'ALTA' | 'MEDIA';
  categoria: 'Liquidez' | 'Rentabilidad' | 'Eficiencia' | 'Crecimiento';
  titulo: string;
  descripcion: string;
  valor_actual: number;
  benchmark: number;
  accion_recomendada: string;
  fecha: Date;
}

export interface KPIsSaaS {
  mrr: number;
  arr: number;
  growth_rate_pct: number;
  rule_of_40: number;
  bessemer_score: number;
  burn_rate: number;
  runway_meses: number;
  gmv: number;
  take_rate_pct: number;
}

export interface ParametrosMacro {
  año: number;
  inflacion_pct: number;
  trm: number;
  tasa_renta_pct: number;
  tasa_iva_pct: number;
  tasa_banrep_pct: number;
}

export interface UserInputs {
  volumenes: Record<string, Record<string, number>>;
  cac: number;
  marketing_pct: number;
  capital_inicial: number;
  num_empleados: number;
  salario_promedio: number;
  churn_mensual: number;
}

export type Periodo = {
  mes: number;
  año: number;
  key: string;
};
