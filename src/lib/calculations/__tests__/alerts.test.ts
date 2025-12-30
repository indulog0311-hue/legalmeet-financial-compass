import { describe, it, expect, vi } from 'vitest';
import { detectarAlertas } from '../alerts';
import { UnitEconomics, BalanceGeneral, KPIsSaaS } from '@/types';

// Mock uuid para tests determinísticos
vi.mock('uuid', () => ({
  v4: () => 'test-uuid-123'
}));

describe('detectarAlertas', () => {
  const mockUnitEconomics: UnitEconomics = {
    cac: 50000,
    arpu_mensual: 100000,
    churn_mensual: 0.05,
    lifespan_meses: 20,
    ltv: 2000000,
    ltv_cac_ratio: 4.0,
    payback_months: 0.5
  };

  const mockBalance: BalanceGeneral = {
    periodo: '2026-01',
    activos: {
      corriente: {
        efectivo: 100000000,
        cuentas_por_cobrar: 50000000,
        total: 150000000
      },
      no_corriente: {
        software: 10000000,
        ppe: 5000000,
        total: 15000000
      },
      total: 165000000
    },
    pasivos: {
      corriente: {
        cuentas_por_pagar: 30000000,
        impuestos_por_pagar: 5000000,
        prestaciones_sociales: 5000000,
        total: 40000000
      },
      no_corriente: {
        deuda_largo_plazo: 15000000,
        total: 15000000
      },
      total: 55000000
    },
    patrimonio: {
      capital: 100000000,
      reserva_legal: 5000000,
      resultados_acumulados: 0,
      resultado_ejercicio: 5000000,
      total: 110000000
    },
    ecuacion_valida: true,
    diferencia: 0
  };

  const mockKPIs: KPIsSaaS = {
    mrr: 10000000,
    arr: 120000000,
    growth_rate_pct: 10,
    rule_of_40: 45,
    bessemer_score: 3.5,
    burn_rate: 5000000,
    runway_meses: 18,
    gmv: 500000000,
    take_rate_pct: 5
  };

  describe('Alerta de Runway Crítico', () => {
    it('genera alerta cuando runway < 6 meses', () => {
      const kpisConRunwayBajo: KPIsSaaS = {
        ...mockKPIs,
        runway_meses: 4
      };

      const alertas = detectarAlertas(mockUnitEconomics, mockBalance, kpisConRunwayBajo, 0);
      
      const alertaRunway = alertas.find(a => a.categoria === 'Liquidez' && a.severidad === 'CRITICA');
      expect(alertaRunway).toBeDefined();
      expect(alertaRunway?.titulo).toContain('Runway Crítico');
    });

    it('no genera alerta cuando runway >= 6 meses', () => {
      const kpisSaludables: KPIsSaaS = {
        ...mockKPIs,
        runway_meses: 12
      };

      const alertas = detectarAlertas(mockUnitEconomics, mockBalance, kpisSaludables, 0);
      
      const alertaRunway = alertas.find(a => a.titulo?.includes('Runway Crítico'));
      expect(alertaRunway).toBeUndefined();
    });
  });

  describe('Alerta de LTV/CAC Insostenible', () => {
    it('genera alerta cuando LTV/CAC < 3', () => {
      const unitEconomicsMalo: UnitEconomics = {
        ...mockUnitEconomics,
        ltv_cac_ratio: 2.5
      };

      const alertas = detectarAlertas(unitEconomicsMalo, mockBalance, mockKPIs, 0);
      
      const alertaLtv = alertas.find(a => a.titulo?.includes('LTV/CAC'));
      expect(alertaLtv).toBeDefined();
      expect(alertaLtv?.severidad).toBe('CRITICA');
    });

    it('no genera alerta cuando LTV/CAC >= 3', () => {
      const unitEconomicsBueno: UnitEconomics = {
        ...mockUnitEconomics,
        ltv_cac_ratio: 5.0
      };

      const alertas = detectarAlertas(unitEconomicsBueno, mockBalance, mockKPIs, 0);
      
      const alertaLtv = alertas.find(a => a.titulo?.includes('LTV/CAC'));
      expect(alertaLtv).toBeUndefined();
    });

    it('no genera alerta cuando LTV/CAC es 0 (evita falso positivo)', () => {
      const unitEconomicsZero: UnitEconomics = {
        ...mockUnitEconomics,
        ltv_cac_ratio: 0
      };

      const alertas = detectarAlertas(unitEconomicsZero, mockBalance, mockKPIs, 0);
      
      const alertaLtv = alertas.find(a => a.titulo?.includes('LTV/CAC'));
      expect(alertaLtv).toBeUndefined();
    });
  });

  describe('Alerta de Balance Descuadrado', () => {
    it('genera alerta cuando balance no cuadra', () => {
      const balanceDescuadrado: BalanceGeneral = {
        ...mockBalance,
        ecuacion_valida: false,
        diferencia: 5000000
      };

      const alertas = detectarAlertas(mockUnitEconomics, balanceDescuadrado, mockKPIs, 0);
      
      const alertaBalance = alertas.find(a => a.titulo?.includes('Balance'));
      expect(alertaBalance).toBeDefined();
      expect(alertaBalance?.severidad).toBe('CRITICA');
    });

    it('no genera alerta cuando balance cuadra', () => {
      const alertas = detectarAlertas(mockUnitEconomics, mockBalance, mockKPIs, 0);
      
      const alertaBalance = alertas.find(a => a.titulo?.includes('Balance'));
      expect(alertaBalance).toBeUndefined();
    });
  });

  describe('Alerta de Churn Elevado', () => {
    it('genera alerta cuando churn > 7%', () => {
      const unitEconomicsChurnAlto: UnitEconomics = {
        ...mockUnitEconomics,
        churn_mensual: 0.10 // 10%
      };

      const alertas = detectarAlertas(unitEconomicsChurnAlto, mockBalance, mockKPIs, 0);
      
      const alertaChurn = alertas.find(a => a.titulo?.includes('Churn'));
      expect(alertaChurn).toBeDefined();
      expect(alertaChurn?.severidad).toBe('ALTA');
    });

    it('no genera alerta cuando churn <= 7%', () => {
      const alertas = detectarAlertas(mockUnitEconomics, mockBalance, mockKPIs, 0);
      
      const alertaChurn = alertas.find(a => a.titulo?.includes('Churn'));
      expect(alertaChurn).toBeUndefined();
    });
  });

  describe('Alerta de CAC Elevado', () => {
    it('genera alerta cuando CAC > benchmark', () => {
      const unitEconomicsCAC: UnitEconomics = {
        ...mockUnitEconomics,
        cac: 150000
      };

      const alertas = detectarAlertas(unitEconomicsCAC, mockBalance, mockKPIs, 0);
      
      const alertaCAC = alertas.find(a => a.titulo?.includes('CAC'));
      expect(alertaCAC).toBeDefined();
      expect(alertaCAC?.severidad).toBe('ALTA');
    });
  });

  describe('Alerta de Flujo Negativo', () => {
    it('genera alerta cuando hay 3+ meses de flujo negativo', () => {
      const alertas = detectarAlertas(mockUnitEconomics, mockBalance, mockKPIs, 4);
      
      const alertaFlujo = alertas.find(a => a.titulo?.includes('Flujo de Caja Negativo'));
      expect(alertaFlujo).toBeDefined();
      expect(alertaFlujo?.severidad).toBe('ALTA');
    });

    it('no genera alerta con menos de 3 meses de flujo negativo', () => {
      const alertas = detectarAlertas(mockUnitEconomics, mockBalance, mockKPIs, 2);
      
      const alertaFlujo = alertas.find(a => a.titulo?.includes('Flujo de Caja Negativo'));
      expect(alertaFlujo).toBeUndefined();
    });
  });

  describe('Ordenamiento de Alertas', () => {
    it('ordena alertas por severidad (CRITICA primero)', () => {
      const unitEconomicsMalo: UnitEconomics = {
        ...mockUnitEconomics,
        ltv_cac_ratio: 2.0,
        churn_mensual: 0.15
      };

      const kpisConRunwayBajo: KPIsSaaS = {
        ...mockKPIs,
        runway_meses: 3
      };

      const alertas = detectarAlertas(unitEconomicsMalo, mockBalance, kpisConRunwayBajo, 5);
      
      expect(alertas.length).toBeGreaterThan(1);
      // Las primeras deben ser CRITICA
      expect(alertas[0].severidad).toBe('CRITICA');
    });
  });

  describe('Manejo de Valores Nulos', () => {
    it('maneja unitEconomics null', () => {
      const alertas = detectarAlertas(null, mockBalance, mockKPIs, 0);
      
      // No debe lanzar error
      expect(Array.isArray(alertas)).toBe(true);
    });

    it('maneja balance null', () => {
      const alertas = detectarAlertas(mockUnitEconomics, null, mockKPIs, 0);
      
      expect(Array.isArray(alertas)).toBe(true);
    });

    it('maneja kpis null', () => {
      const alertas = detectarAlertas(mockUnitEconomics, mockBalance, null, 0);
      
      expect(Array.isArray(alertas)).toBe(true);
    });

    it('maneja todos null', () => {
      const alertas = detectarAlertas(null, null, null, 0);
      
      expect(alertas).toEqual([]);
    });
  });

  describe('Estructura de Alertas', () => {
    it('cada alerta tiene todos los campos requeridos', () => {
      const kpisConRunwayBajo: KPIsSaaS = {
        ...mockKPIs,
        runway_meses: 3
      };

      const alertas = detectarAlertas(mockUnitEconomics, mockBalance, kpisConRunwayBajo, 0);
      
      if (alertas.length > 0) {
        const alerta = alertas[0];
        expect(alerta).toHaveProperty('id');
        expect(alerta).toHaveProperty('severidad');
        expect(alerta).toHaveProperty('categoria');
        expect(alerta).toHaveProperty('titulo');
        expect(alerta).toHaveProperty('descripcion');
        expect(alerta).toHaveProperty('valor_actual');
        expect(alerta).toHaveProperty('benchmark');
        expect(alerta).toHaveProperty('accion_recomendada');
        expect(alerta).toHaveProperty('fecha');
      }
    });
  });
});
