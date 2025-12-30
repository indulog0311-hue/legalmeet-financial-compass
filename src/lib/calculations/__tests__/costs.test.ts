import { describe, it, expect } from 'vitest';
import { calcularCOGS, calcularOPEX, calcularBurnRate, calcularRunway } from '../costs';
import { SKU } from '@/types';

describe('calcularCOGS', () => {
  const mockSKU: SKU = {
    sku_id: 'TEST-001',
    nombre_producto: 'Test SKU',
    tipo_revenue: 'digital',
    precio_base_cop: 150000,
    costo_cloud: 500,
    genera_escrow: true,
    payout_abogado_pct: 30,
    aplica_iva: true,
    tasa_iva: 19,
    margen_target_pct: 50,
    costo_sagrilaft: 3000,
    gateway_fee_pct: 2.9,
    activo: true,
  };

  it('calcula COGS con volumen normal', () => {
    const resultado = calcularCOGS(
      [mockSKU],
      { 'TEST-001': 100 },
      15000000,
      0.7
    );

    expect(resultado.total).toBeGreaterThan(0);
    expect(resultado.cloud).toBe(50000); // 500 * 100
    expect(resultado.sagrilaft).toBe(300000); // 3000 * 100
    expect(resultado.almacenamiento).toBe(50000); // 500 * 100 (digital)
  });

  it('calcula payout a abogados correctamente', () => {
    const resultado = calcularCOGS(
      [mockSKU],
      { 'TEST-001': 100 },
      15000000,
      0.7
    );

    // 150000 * 100 * 0.30 = 4,500,000
    expect(resultado.lawyer_payouts).toBe(4500000);
  });

  it('calcula gateway con mix digital/efectivo', () => {
    const resultado = calcularCOGS(
      [mockSKU],
      { 'TEST-001': 100 },
      15000000,
      0.7
    );

    // 100 * (0.7 * 6500 + 0.3 * 7200) = 100 * 6710 = 671000
    expect(resultado.gateway).toBe(671000);
  });

  it('maneja volumen = 0', () => {
    const resultado = calcularCOGS(
      [mockSKU],
      { 'TEST-001': 0 },
      0,
      0.7
    );

    expect(resultado.cloud).toBe(0);
    expect(resultado.sagrilaft).toBe(0);
    expect(resultado.lawyer_payouts).toBe(0);
    expect(resultado.gateway).toBe(0);
    expect(resultado.total).toBe(0);
  });

  it('no calcula SAGRILAFT para SKUs sin escrow', () => {
    const skuSinEscrow: SKU = { ...mockSKU, genera_escrow: false };
    const resultado = calcularCOGS(
      [skuSinEscrow],
      { 'TEST-001': 100 },
      15000000,
      0.7
    );

    expect(resultado.sagrilaft).toBe(0);
  });

  it('no calcula almacenamiento para SKUs no digitales', () => {
    const skuFisico: SKU = { ...mockSKU, tipo_revenue: 'transaccional' };
    const resultado = calcularCOGS(
      [skuFisico],
      { 'TEST-001': 100 },
      15000000,
      0.7
    );

    expect(resultado.almacenamiento).toBe(0);
  });
});

describe('calcularOPEX', () => {
  it('calcula personal con factor prestacional', () => {
    const resultado = calcularOPEX(
      5,          // numEmpleados
      5000000,    // salarioPromedio
      100000000,  // ingresoTotal
      10,         // marketingPct
      500000      // depreciacion
    );

    // 5 * 5000000 * 1.52 = 38,000,000
    expect(resultado.personal).toBe(38000000);
  });

  it('calcula marketing como % de ingresos', () => {
    const resultado = calcularOPEX(
      5,
      5000000,
      100000000,
      10,
      500000
    );

    // 100000000 * 0.10 = 10,000,000
    expect(resultado.marketing).toBe(10000000);
  });

  it('incluye depreciación en total', () => {
    const resultado = calcularOPEX(
      5,
      5000000,
      100000000,
      10,
      500000
    );

    expect(resultado.depreciacion).toBe(500000);
    expect(resultado.total).toBeGreaterThan(resultado.personal + resultado.marketing);
  });

  it('maneja valores cero', () => {
    const resultado = calcularOPEX(0, 0, 0, 0, 0);

    expect(resultado.personal).toBe(0);
    expect(resultado.marketing).toBe(0);
    expect(resultado.depreciacion).toBe(0);
    // Administrativos y tecnología todavía tienen valores base del catálogo
    expect(resultado.total).toBeGreaterThanOrEqual(0);
  });
});

describe('calcularBurnRate', () => {
  it('calcula burn rate cuando costos > ingresos', () => {
    const resultado = calcularBurnRate(80000000, 100000000);
    expect(resultado).toBe(20000000);
  });

  it('retorna 0 cuando ingresos > costos (profitable)', () => {
    const resultado = calcularBurnRate(100000000, 80000000);
    expect(resultado).toBe(0);
  });

  it('retorna 0 cuando ingresos = costos (break-even)', () => {
    const resultado = calcularBurnRate(100000000, 100000000);
    expect(resultado).toBe(0);
  });
});

describe('calcularRunway', () => {
  it('calcula runway en meses', () => {
    const resultado = calcularRunway(500000000, 50000000);
    expect(resultado).toBe(10);
  });

  it('retorna Infinity cuando burn rate es 0', () => {
    const resultado = calcularRunway(500000000, 0);
    expect(resultado).toBe(Infinity);
  });

  it('retorna Infinity cuando burn rate es negativo', () => {
    const resultado = calcularRunway(500000000, -10000000);
    expect(resultado).toBe(Infinity);
  });
});
