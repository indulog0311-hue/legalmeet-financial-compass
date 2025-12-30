import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useSimuladorStore } from '@/store/simuladorStore';

describe('Flujo Completo de Simulación', () => {
  beforeEach(() => {
    // Limpiar estado entre tests
    act(() => {
      useSimuladorStore.getState().limpiarTodo?.();
    });
  });

  describe('Configuración → Proyección', () => {
    it('debe actualizar configuración y regenerar volúmenes', () => {
      const store = useSimuladorStore.getState();
      
      act(() => {
        store.actualizarConfigVolumenes({
          volumenInicialPorSKU: 10,
          tasaCrecimientoDefault: 0.08
        });
      });
      
      const state = useSimuladorStore.getState();
      expect(state.configVolumenes.volumenInicialPorSKU).toBe(10);
      expect(state.configVolumenes.tasaCrecimientoDefault).toBe(0.08);
    });

    it('debe calcular volúmenes con crecimiento compuesto', () => {
      const store = useSimuladorStore.getState();
      
      act(() => {
        store.actualizarConfigVolumenes({
          volumenInicialPorSKU: 100,
          tasaCrecimientoDefault: 0.10 // 10% mensual
        });
      });
      
      const state = useSimuladorStore.getState();
      const volumenes2026 = state.getVolumenesAño(2026);
      const primerSku = Object.keys(volumenes2026)[0];
      
      if (primerSku) {
        const volumenMes1 = volumenes2026[primerSku][1];
        const volumenMes12 = volumenes2026[primerSku][12];
        
        // Con 10% mensual, mes 12 ≈ mes 1 × (1.10)^11 ≈ 2.85x
        expect(volumenMes12).toBeGreaterThan(volumenMes1 * 2);
        expect(volumenMes12).toBeLessThan(volumenMes1 * 4);
      }
    });

    it('debe mantener coherencia entre años', () => {
      const state = useSimuladorStore.getState();
      const vol2026 = state.getVolumenesAño(2026);
      const vol2027 = state.getVolumenesAño(2027);
      const primerSku = Object.keys(vol2026)[0];
      
      if (primerSku) {
        // Diciembre 2026 → Enero 2027 debe ser crecimiento continuo
        const volDic2026 = vol2026[primerSku][12];
        const volEne2027 = vol2027[primerSku][1];
        
        expect(volEne2027).toBeGreaterThan(volDic2026);
      }
    });
  });

  describe('Persistencia de Estado', () => {
    it('debe mantener precios personalizados', () => {
      const store = useSimuladorStore.getState();
      const primerSku = store.catalogoIngresos[0]?.codigo;
      
      if (primerSku) {
        act(() => {
          store.actualizarPrecio(primerSku, 999999);
        });
        
        const state = useSimuladorStore.getState();
        expect(state.getPrecioEfectivo(primerSku)).toBe(999999);
      }
    });

    it('debe mantener tasas de crecimiento personalizadas', () => {
      const store = useSimuladorStore.getState();
      const primerSku = store.catalogoIngresos[0]?.codigo;
      
      if (primerSku) {
        act(() => {
          store.actualizarTasaCrecimientoSKU(primerSku, 0.15);
        });
        
        const state = useSimuladorStore.getState();
        expect(state.getTasaCrecimientoSKU(primerSku)).toBe(0.15);
      }
    });
  });

  describe('Reset y Limpieza', () => {
    it('debe restaurar estado después de limpiar', () => {
      const store = useSimuladorStore.getState();
      const configOriginal = { ...store.config };
      
      act(() => {
        store.actualizarConfig({ capitalInicial: 1 });
        store.limpiarTodo();
      });
      
      const state = useSimuladorStore.getState();
      expect(state.config.capitalInicial).toBe(configOriginal.capitalInicial);
    });

    it('debe limpiar precios personalizados', () => {
      const store = useSimuladorStore.getState();
      
      act(() => {
        store.actualizarPrecio('TEST-SKU', 999);
        store.limpiarTodo();
      });
      
      const state = useSimuladorStore.getState();
      expect(state.preciosPersonalizados).toEqual({});
    });
  });

  describe('Getters Compuestos', () => {
    it('getCatalogoCompleto retorna todos los catálogos', () => {
      const state = useSimuladorStore.getState();
      const completo = state.getCatalogoCompleto();
      
      const totalEsperado = 
        state.catalogoIngresos.length +
        state.catalogoCostos.length +
        state.catalogoOPEX.length +
        state.catalogoImpuestos.length;
      
      expect(completo.length).toBe(totalEsperado);
    });

    it('getVolumenesAño retorna estructura correcta', () => {
      const state = useSimuladorStore.getState();
      const vol2026 = state.getVolumenesAño(2026);
      
      expect(Object.keys(vol2026).length).toBeGreaterThan(0);
      
      const primerSku = Object.keys(vol2026)[0];
      if (primerSku) {
        expect(Object.keys(vol2026[primerSku]).length).toBe(12);
      }
    });
  });
});

describe('Validaciones de Negocio', () => {
  beforeEach(() => {
    act(() => {
      useSimuladorStore.getState().limpiarTodo?.();
    });
  });

  it('parámetros macro tienen coherencia temporal', () => {
    const state = useSimuladorStore.getState();
    
    // Inflación debe ser decreciente o estable
    const inflacion2026 = state.parametrosMacro.find(p => p.año === 2026)?.inflacionPct || 0;
    const inflacion2031 = state.parametrosMacro.find(p => p.año === 2031)?.inflacionPct || 0;
    
    expect(inflacion2026).toBeGreaterThanOrEqual(inflacion2031);
  });

  it('salario mínimo debe ser creciente', () => {
    const state = useSimuladorStore.getState();
    
    const salario2026 = state.parametrosMacro.find(p => p.año === 2026)?.salarioMinimo || 0;
    const salario2031 = state.parametrosMacro.find(p => p.año === 2031)?.salarioMinimo || 0;
    
    expect(salario2031).toBeGreaterThan(salario2026);
  });

  it('tasa de renta debe ser constante', () => {
    const state = useSimuladorStore.getState();
    
    const tasas = state.parametrosMacro.map(p => p.tasaRentaPct);
    const todasIguales = tasas.every(t => t === tasas[0]);
    
    expect(todasIguales).toBe(true);
  });
});
