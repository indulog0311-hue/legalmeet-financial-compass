import { describe, it, expect } from 'vitest';
import {
  calcularBurnRate,
  calcularRunway,
  calcularBurnRateCompleto,
  calcularMargenes,
  calcularUnitEconomicsSimple,
  calcularGrossUp,
  evaluarLtvCac,
  RUNWAY_THRESHOLDS,
} from '../metrics';

describe('calcularBurnRate', () => {
  it('calcula burn cuando costos > ingresos', () => {
    expect(calcularBurnRate(80000000, 100000000)).toBe(20000000);
  });

  it('retorna 0 cuando ingresos >= costos', () => {
    expect(calcularBurnRate(100000000, 80000000)).toBe(0);
    expect(calcularBurnRate(100000000, 100000000)).toBe(0);
  });
});

describe('calcularRunway', () => {
  it('calcula runway en meses', () => {
    expect(calcularRunway(500000000, 50000000)).toBe(10);
  });

  it('retorna INFINITO cuando burn es 0 o negativo', () => {
    expect(calcularRunway(500000000, 0)).toBe(RUNWAY_THRESHOLDS.INFINITO);
    expect(calcularRunway(500000000, -10)).toBe(RUNWAY_THRESHOLDS.INFINITO);
  });
});

describe('calcularBurnRateCompleto', () => {
  it('retorna estado critico cuando runway < 6', () => {
    const resultado = calcularBurnRateCompleto({
      ingresosMensuales: 10000000,
      costosMensuales: 60000000,
      capitalDisponible: 200000000, // 4 meses runway
    });

    expect(resultado.estado).toBe('critico');
    expect(resultado.runway).toBeLessThan(6);
  });

  it('retorna estado alerta cuando 6 <= runway < 12', () => {
    const resultado = calcularBurnRateCompleto({
      ingresosMensuales: 10000000,
      costosMensuales: 60000000,
      capitalDisponible: 400000000, // 8 meses runway
    });

    expect(resultado.estado).toBe('alerta');
  });

  it('retorna estado saludable cuando runway >= 12', () => {
    const resultado = calcularBurnRateCompleto({
      ingresosMensuales: 50000000,
      costosMensuales: 60000000,
      capitalDisponible: 500000000, // 50 meses runway
    });

    expect(resultado.estado).toBe('saludable');
  });

  it('retorna saludable cuando empresa es rentable', () => {
    const resultado = calcularBurnRateCompleto({
      ingresosMensuales: 100000000,
      costosMensuales: 60000000,
      capitalDisponible: 500000000,
    });

    expect(resultado.burnRateMensual).toBe(0);
    expect(resultado.estado).toBe('saludable');
  });
});

describe('calcularMargenes', () => {
  it('calcula márgenes correctamente', () => {
    const resultado = calcularMargenes({
      ingresos: 100000000,
      cogs: 30000000,
      opex: 40000000,
      depreciacion: 5000000,
      impuestos: 10000000,
    });

    // Bruto = (100 - 30) / 100 = 70%
    expect(resultado.margenBruto).toBeCloseTo(70, 1);
    
    // EBITDA = (100 - 30 - 40) / 100 = 30%
    expect(resultado.margenEBITDA).toBeCloseTo(30, 1);
    
    // Neto = (30 - 5 - 10) / 100 = 15%
    expect(resultado.margenNeto).toBeCloseTo(15, 1);
  });

  it('retorna 0 cuando ingresos = 0', () => {
    const resultado = calcularMargenes({
      ingresos: 0,
      cogs: 30000000,
      opex: 40000000,
    });

    expect(resultado.margenBruto).toBe(0);
    expect(resultado.margenEBITDA).toBe(0);
    expect(resultado.margenNeto).toBe(0);
  });
});

describe('calcularUnitEconomicsSimple', () => {
  it('calcula LTV/CAC correctamente', () => {
    const resultado = calcularUnitEconomicsSimple({
      arpu: 100000,
      churnMensual: 0.05,
      cac: 500000,
    });

    // LTV = 100000 * (1/0.05) = 2,000,000
    expect(resultado.ltv).toBeCloseTo(2000000, -2);
    
    // LTV/CAC = 2M / 500k = 4
    expect(resultado.ltvCacRatio).toBeCloseTo(4, 1);
    
    // Payback = 500k / 100k = 5 meses
    expect(resultado.paybackMeses).toBeCloseTo(5, 1);
  });

  it('maneja churn = 0 sin error', () => {
    const resultado = calcularUnitEconomicsSimple({
      arpu: 100000,
      churnMensual: 0,
      cac: 500000,
    });

    expect(Number.isFinite(resultado.ltv)).toBe(true);
    expect(resultado.ltv).toBe(0);
  });
});

describe('calcularGrossUp', () => {
  it('calcula gross-up ReteFuente 11%', () => {
    const resultado = calcularGrossUp(100000, 0.11);

    // Base = 100000 / 0.89 = 112359.55
    expect(resultado.baseGravable).toBeCloseTo(112360, 0);
    
    // Retención = 112360 * 0.11 = 12360
    expect(resultado.retencion).toBeCloseTo(12360, 0);
  });

  it('maneja tasa = 0', () => {
    const resultado = calcularGrossUp(100000, 0);
    expect(resultado.baseGravable).toBe(100000);
    expect(resultado.retencion).toBe(0);
  });

  it('maneja tasa >= 100%', () => {
    const resultado = calcularGrossUp(100000, 1.0);
    expect(resultado.baseGravable).toBe(100000);
    expect(resultado.retencion).toBe(0);
  });
});

describe('evaluarLtvCac', () => {
  it('evalúa correctamente los rangos', () => {
    expect(evaluarLtvCac(6)).toBe('excelente');
    expect(evaluarLtvCac(5)).toBe('excelente');
    expect(evaluarLtvCac(4)).toBe('bueno');
    expect(evaluarLtvCac(3)).toBe('bueno');
    expect(evaluarLtvCac(2)).toBe('alerta');
    expect(evaluarLtvCac(0.5)).toBe('critico');
  });
});
