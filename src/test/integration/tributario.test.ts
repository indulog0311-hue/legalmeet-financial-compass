import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { calcularProyeccionAnual } from '@/lib/calculations/motorFinanciero';
import { IMPUESTOS } from '@/lib/constants/financialConstants';

describe('Escenarios Tributarios', () => {
  beforeEach(() => {
    act(() => {
      useSimuladorStore.getState().limpiarTodo?.();
    });
  });

  describe('ICA Bogotá', () => {
    it('debe calcular ICA con tasa correcta (0.966%)', () => {
      const ingresosBrutos = 100000000; // $100M
      const icaEsperado = ingresosBrutos * IMPUESTOS.ICA_BOGOTA;
      
      // ICA = 100M × 0.00966 = $966,000
      expect(icaEsperado).toBeCloseTo(966000, -2);
    });

    it('tasa ICA debe ser 0.00966', () => {
      expect(IMPUESTOS.ICA_BOGOTA).toBe(0.00966);
    });
  });

  describe('Retención en la Fuente', () => {
    it('debe aplicar 11% sobre pagos a abogados', () => {
      const pagoAbogado = 1000000;
      const retefuente = pagoAbogado * IMPUESTOS.RETEFUENTE_SERVICIOS;
      
      expect(retefuente).toBe(110000);
    });
  });

  describe('GMF (4×1000)', () => {
    it('debe calcular GMF correctamente', () => {
      const montoDispersion = 10000000;
      const gmf = montoDispersion * IMPUESTOS.GMF;
      
      expect(gmf).toBe(40000); // 4×1000
    });
  });

  describe('Impuesto de Renta', () => {
    it('tasa de renta debe ser 35%', () => {
      expect(IMPUESTOS.TASA_RENTA).toBe(0.35);
    });

    it('provisión de renta solo sobre utilidad positiva', () => {
      const utilidadPositiva = 100000000;
      const utilidadNegativa = -50000000;
      
      const provisionPositiva = utilidadPositiva > 0 
        ? utilidadPositiva * IMPUESTOS.TASA_RENTA 
        : 0;
      const provisionNegativa = utilidadNegativa > 0 
        ? utilidadNegativa * IMPUESTOS.TASA_RENTA 
        : 0;
      
      expect(provisionPositiva).toBe(35000000);
      expect(provisionNegativa).toBe(0);
    });
  });

  describe('IVA', () => {
    it('tasa IVA debe ser 19%', () => {
      expect(IMPUESTOS.IVA).toBe(0.19);
    });
  });

  describe('Carga Tributaria Total', () => {
    it('debe calcular carga tributaria coherente', () => {
      const state = useSimuladorStore.getState();
      const volumenes = state.getVolumenesAño(2026);
      
      const proyeccion = calcularProyeccionAnual(
        2026,
        volumenes,
        state.config,
        state.parametrosMacro,
        state.catalogoIngresos
      );
      
      // ICA mensual acumulado
      const totalICA = proyeccion.meses.reduce((sum, m) => sum + m.icaBogota, 0);
      
      // Debe ser aproximadamente 0.966% de ingresos brutos
      const icaEsperado = proyeccion.totales.ingresosBrutos * IMPUESTOS.ICA_BOGOTA;
      expect(totalICA).toBeCloseTo(icaEsperado, -3);
    });
  });
});

describe('Constantes Tributarias', () => {
  it('IMPUESTOS tiene todas las tasas definidas', () => {
    expect(IMPUESTOS).toHaveProperty('TASA_RENTA');
    expect(IMPUESTOS).toHaveProperty('IVA');
    expect(IMPUESTOS).toHaveProperty('ICA_BOGOTA');
    expect(IMPUESTOS).toHaveProperty('GMF');
    expect(IMPUESTOS).toHaveProperty('RETEFUENTE_SERVICIOS');
  });

  it('tasas tributarias están en rango válido', () => {
    expect(IMPUESTOS.TASA_RENTA).toBeGreaterThan(0);
    expect(IMPUESTOS.TASA_RENTA).toBeLessThan(1);
    
    expect(IMPUESTOS.IVA).toBeGreaterThan(0);
    expect(IMPUESTOS.IVA).toBeLessThan(1);
    
    expect(IMPUESTOS.ICA_BOGOTA).toBeGreaterThan(0);
    expect(IMPUESTOS.ICA_BOGOTA).toBeLessThan(0.1);
    
    expect(IMPUESTOS.GMF).toBeGreaterThan(0);
    expect(IMPUESTOS.GMF).toBeLessThan(0.01);
  });
});
