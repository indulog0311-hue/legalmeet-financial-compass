import { describe, it, expect } from 'vitest';
import { 
  calcularUnitEconomics, 
  calcularPrecioIndexado, 
  calcularARPU,
  calcularMRR 
} from '../revenue';

describe('calcularUnitEconomics', () => {
  it('calcula LTV = ARPU / Churn', () => {
    const resultado = calcularUnitEconomics(
      100000,  // cac
      50000,   // arpu
      0.05     // churnMensual
    );

    // lifespan = 1 / 0.05 = 20 meses
    expect(resultado.lifespan_meses).toBeCloseTo(20, 1);
    
    // LTV = 50000 * 20 = 1,000,000
    expect(resultado.ltv).toBeCloseTo(1000000, -2);
  });

  it('calcula LTV/CAC ratio correctamente', () => {
    const resultado = calcularUnitEconomics(
      100000,  // cac
      50000,   // arpu
      0.05     // churnMensual
    );

    // LTV/CAC = 1,000,000 / 100,000 = 10
    expect(resultado.ltv_cac_ratio).toBeCloseTo(10, 1);
  });

  it('calcula payback months correctamente', () => {
    const resultado = calcularUnitEconomics(
      100000,  // cac
      50000,   // arpu
      0.05     // churnMensual
    );

    // Payback = CAC / ARPU = 100000 / 50000 = 2 meses
    expect(resultado.payback_months).toBeCloseTo(2, 1);
  });

  it('maneja churn = 0 sin Infinity', () => {
    const resultado = calcularUnitEconomics(
      100000,
      50000,
      0
    );

    // When churn is 0 or invalid, should return safe defaults
    expect(Number.isFinite(resultado.lifespan_meses)).toBe(true);
    expect(Number.isFinite(resultado.ltv)).toBe(true);
    expect(resultado.ltv).toBe(0);
  });

  it('maneja churn = 100% (1.0)', () => {
    const resultado = calcularUnitEconomics(
      100000,
      50000,
      1.0
    );

    // Churn >= 1 returns safe defaults
    expect(resultado.lifespan_meses).toBe(0);
    expect(resultado.ltv).toBe(0);
  });

  it('maneja CAC = 0', () => {
    const resultado = calcularUnitEconomics(
      0,
      50000,
      0.05
    );

    expect(resultado.cac).toBe(0);
    expect(resultado.ltv_cac_ratio).toBe(0);
  });

  it('maneja ARPU = 0', () => {
    const resultado = calcularUnitEconomics(
      100000,
      0,
      0.05
    );

    expect(resultado.arpu_mensual).toBe(0);
    expect(resultado.ltv).toBe(0);
  });

  it('calcula valores correctos para SaaS típico', () => {
    // Escenario: CAC $500k, ARPU $100k/mes, churn 3%/mes
    const resultado = calcularUnitEconomics(
      500000,
      100000,
      0.03
    );

    // Lifespan = 1/0.03 = 33.33 meses
    expect(resultado.lifespan_meses).toBeCloseTo(33.33, 1);
    
    // LTV = 100000 * 33.33 = 3,333,333
    expect(resultado.ltv).toBeCloseTo(3333333, -3);
    
    // LTV/CAC = 3.33M / 500k = 6.67
    expect(resultado.ltv_cac_ratio).toBeCloseTo(6.67, 1);
    
    // Payback = 500k / 100k = 5 meses
    expect(resultado.payback_months).toBeCloseTo(5, 1);
  });
});

describe('calcularPrecioIndexado', () => {
  it('mantiene precio si año base = año actual', () => {
    const resultado = calcularPrecioIndexado(100000, 2026, 2026);
    expect(resultado).toBe(100000);
  });

  it('incrementa precio por inflación', () => {
    // Con inflación del 5% anual
    const resultado = calcularPrecioIndexado(100000, 2026, 2027);
    // Debería ser mayor que el precio base
    expect(resultado).toBeGreaterThan(100000);
  });

  it('redondea a entero', () => {
    const resultado = calcularPrecioIndexado(100001, 2026, 2026);
    expect(Number.isInteger(resultado)).toBe(true);
  });
});

describe('calcularARPU', () => {
  it('calcula ARPU = Ingresos / Usuarios', () => {
    const resultado = calcularARPU(10000000, 100);
    expect(resultado).toBe(100000);
  });

  it('retorna 0 cuando usuarios = 0', () => {
    const resultado = calcularARPU(10000000, 0);
    expect(resultado).toBe(0);
  });

  it('maneja ingresos negativos', () => {
    const resultado = calcularARPU(-1000000, 100);
    expect(resultado).toBe(-10000);
  });
});

describe('calcularMRR', () => {
  it('suma ingresos recurrentes para MRR', () => {
    const resultado = calcularMRR([100000, 200000, 300000]);
    expect(resultado.mrr).toBe(600000);
  });

  it('calcula ARR = MRR * 12', () => {
    const resultado = calcularMRR([100000, 200000, 300000]);
    expect(resultado.arr).toBe(7200000);
  });

  it('maneja array vacío', () => {
    const resultado = calcularMRR([]);
    expect(resultado.mrr).toBe(0);
    expect(resultado.arr).toBe(0);
  });

  it('maneja valores negativos', () => {
    const resultado = calcularMRR([100000, -50000, 200000]);
    expect(resultado.mrr).toBe(250000);
    expect(resultado.arr).toBe(3000000);
  });

  it('maneja un solo valor', () => {
    const resultado = calcularMRR([500000]);
    expect(resultado.mrr).toBe(500000);
    expect(resultado.arr).toBe(6000000);
  });
});

describe('calcularUnitEconomics - Edge Cases Adicionales', () => {
  it('maneja valores muy pequeños sin perder precisión', () => {
    const resultado = calcularUnitEconomics(
      1000,    // cac muy bajo
      100,     // arpu muy bajo
      0.01     // churn 1%
    );

    expect(resultado.lifespan_meses).toBeCloseTo(100, 0);
    expect(resultado.ltv).toBeCloseTo(10000, -1);
    expect(resultado.ltv_cac_ratio).toBeCloseTo(10, 0);
  });

  it('maneja valores muy grandes sin overflow', () => {
    const resultado = calcularUnitEconomics(
      1000000000,  // CAC $1B
      500000000,   // ARPU $500M
      0.02         // churn 2%
    );

    expect(Number.isFinite(resultado.ltv)).toBe(true);
    expect(Number.isFinite(resultado.ltv_cac_ratio)).toBe(true);
    expect(resultado.ltv).toBeGreaterThan(0);
  });

  it('calcula payback months fractional', () => {
    const resultado = calcularUnitEconomics(
      150000,  // cac
      100000,  // arpu
      0.05     // churn
    );

    expect(resultado.payback_months).toBeCloseTo(1.5, 1);
  });

  it('maneja churn casi 100%', () => {
    const resultado = calcularUnitEconomics(
      100000,
      50000,
      0.99  // 99% churn
    );

    expect(resultado.lifespan_meses).toBeCloseTo(1.01, 1);
  });
});

describe('calcularARPU - Edge Cases Adicionales', () => {
  it('calcula ARPU con valores decimales', () => {
    const resultado = calcularARPU(1234567, 123);
    expect(resultado).toBeCloseTo(10037.13, 0);
  });

  it('maneja usuarios = 1', () => {
    const resultado = calcularARPU(5000000, 1);
    expect(resultado).toBe(5000000);
  });

  it('maneja ingresos = 0', () => {
    const resultado = calcularARPU(0, 100);
    expect(resultado).toBe(0);
  });
});
