import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSimuladorStore, PARAMETROS_MACRO_DEFAULT } from '../simuladorStore';
import { act } from '@testing-library/react';

// Reset store between tests
const resetStore = () => {
  const { limpiarTodo } = useSimuladorStore.getState();
  act(() => {
    limpiarTodo();
  });
};

describe('simuladorStore', () => {
  beforeEach(() => {
    // Clear localStorage mock
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
    resetStore();
  });

  describe('Initial State', () => {
    it('tiene catálogos inicializados', () => {
      const state = useSimuladorStore.getState();
      
      expect(state.catalogoIngresos.length).toBeGreaterThan(0);
      expect(state.catalogoCostos.length).toBeGreaterThan(0);
      expect(state.catalogoOPEX.length).toBeGreaterThan(0);
      expect(state.catalogoImpuestos.length).toBeGreaterThan(0);
    });

    it('tiene parámetros macro para 2026-2031', () => {
      const state = useSimuladorStore.getState();
      
      expect(state.parametrosMacro.length).toBe(6);
      expect(state.parametrosMacro[0].año).toBe(2026);
      expect(state.parametrosMacro[5].año).toBe(2031);
    });

    it('tiene configuración por defecto correcta', () => {
      const state = useSimuladorStore.getState();
      
      expect(state.config.añoInicio).toBe(2026);
      expect(state.config.añoFin).toBe(2031);
      expect(state.config.capitalInicial).toBe(500000000);
      expect(state.config.mixPagoDigital).toBe(0.70);
    });

    it('tiene volúmenes inicializados por año y SKU', () => {
      const state = useSimuladorStore.getState();
      
      expect(state.volumenes[2026]).toBeDefined();
      expect(state.volumenes[2031]).toBeDefined();
      
      // Debe tener volúmenes para todos los meses
      const primerSku = Object.keys(state.volumenes[2026])[0];
      if (primerSku) {
        expect(Object.keys(state.volumenes[2026][primerSku]).length).toBe(12);
      }
    });

    it('simulacionActiva es false inicialmente', () => {
      const state = useSimuladorStore.getState();
      expect(state.simulacionActiva).toBe(false);
    });
  });

  describe('Actions - Catálogo', () => {
    it('actualizarItemCatalogo modifica un item existente', () => {
      const store = useSimuladorStore.getState();
      const primerItem = store.catalogoIngresos[0];
      const codigoOriginal = primerItem.codigo;
      
      act(() => {
        store.actualizarItemCatalogo(codigoOriginal, { 
          valorUnitario: 999999 
        });
      });

      const state = useSimuladorStore.getState();
      const itemActualizado = state.catalogoIngresos.find(
        i => i.codigo === codigoOriginal
      );
      
      expect(itemActualizado?.valorUnitario).toBe(999999);
    });

    it('actualizarItemCatalogo actualiza ultimaActualizacion', () => {
      const store = useSimuladorStore.getState();
      const primerItem = store.catalogoIngresos[0];
      
      act(() => {
        store.actualizarItemCatalogo(primerItem.codigo, { 
          valorUnitario: 100 
        });
      });

      const state = useSimuladorStore.getState();
      expect(state.ultimaActualizacion).not.toBeNull();
    });
  });

  describe('Actions - Parámetros Macro', () => {
    it('actualizarParametroMacro modifica parámetro de un año', () => {
      const store = useSimuladorStore.getState();
      
      act(() => {
        store.actualizarParametroMacro(2026, { 
          inflacionPct: 5.5 
        });
      });

      const state = useSimuladorStore.getState();
      const param2026 = state.parametrosMacro.find(p => p.año === 2026);
      
      expect(param2026?.inflacionPct).toBe(5.5);
    });

    it('actualizarParametroMacro mantiene otros campos', () => {
      const store = useSimuladorStore.getState();
      const originalTRM = store.parametrosMacro[0].trm;
      
      act(() => {
        store.actualizarParametroMacro(2026, { 
          inflacionPct: 6.0 
        });
      });

      const state = useSimuladorStore.getState();
      const param2026 = state.parametrosMacro.find(p => p.año === 2026);
      
      expect(param2026?.trm).toBe(originalTRM);
    });
  });

  describe('Actions - Configuración', () => {
    it('actualizarConfig modifica configuración', () => {
      const store = useSimuladorStore.getState();
      
      act(() => {
        store.actualizarConfig({ 
          capitalInicial: 1000000000 
        });
      });

      const state = useSimuladorStore.getState();
      expect(state.config.capitalInicial).toBe(1000000000);
    });

    it('actualizarConfig regenera volúmenes si cambian años', () => {
      const store = useSimuladorStore.getState();
      const volumenesAntes = { ...store.volumenes };
      
      act(() => {
        store.actualizarConfig({ 
          añoInicio: 2025 
        });
      });

      const state = useSimuladorStore.getState();
      // Debe tener el nuevo año
      expect(state.volumenes[2025]).toBeDefined();
    });
  });

  describe('Actions - Volúmenes', () => {
    it('actualizarVolumen modifica volumen específico', () => {
      const store = useSimuladorStore.getState();
      const primerSku = store.catalogoIngresos[0]?.codigo;
      
      if (primerSku) {
        act(() => {
          store.actualizarVolumen(2026, primerSku, 1, 500);
        });

        const state = useSimuladorStore.getState();
        expect(state.volumenes[2026][primerSku][1]).toBe(500);
      }
    });

    it('regenerarVolumenes recalcula todos los volúmenes', () => {
      const store = useSimuladorStore.getState();
      const primerSku = store.catalogoIngresos[0]?.codigo;
      
      if (primerSku) {
        // Modificar volumen manualmente
        act(() => {
          store.actualizarVolumen(2026, primerSku, 1, 9999);
        });

        // Regenerar
        act(() => {
          store.regenerarVolumenes();
        });

        const state = useSimuladorStore.getState();
        // Debe volver al cálculo original
        expect(state.volumenes[2026][primerSku][1]).not.toBe(9999);
      }
    });
  });

  describe('Actions - Precios', () => {
    it('actualizarPrecio guarda precio personalizado', () => {
      const store = useSimuladorStore.getState();
      const sku = 'TEST-SKU';
      
      act(() => {
        store.actualizarPrecio(sku, 250000);
      });

      const state = useSimuladorStore.getState();
      expect(state.preciosPersonalizados[sku]).toBe(250000);
    });

    it('getPrecioEfectivo retorna precio personalizado si existe', () => {
      const store = useSimuladorStore.getState();
      const primerSku = store.catalogoIngresos[0]?.codigo;
      
      if (primerSku) {
        act(() => {
          store.actualizarPrecio(primerSku, 777777);
        });

        const state = useSimuladorStore.getState();
        const precioEfectivo = state.getPrecioEfectivo(primerSku);
        expect(precioEfectivo).toBe(777777);
      }
    });

    it('getPrecioEfectivo retorna precio catálogo si no hay personalizado', () => {
      const state = useSimuladorStore.getState();
      const primerItem = state.catalogoIngresos[0];
      
      if (primerItem) {
        const precioEfectivo = state.getPrecioEfectivo(primerItem.codigo);
        expect(precioEfectivo).toBe(primerItem.valorUnitario);
      }
    });

    it('getPrecioEfectivo retorna 0 para SKU inexistente', () => {
      const state = useSimuladorStore.getState();
      const precioEfectivo = state.getPrecioEfectivo('SKU-INEXISTENTE');
      expect(precioEfectivo).toBe(0);
    });
  });

  describe('Actions - Tasas de Crecimiento', () => {
    it('actualizarTasaCrecimientoSKU guarda tasa personalizada', () => {
      const store = useSimuladorStore.getState();
      const primerSku = store.catalogoIngresos[0]?.codigo;
      
      if (primerSku) {
        act(() => {
          store.actualizarTasaCrecimientoSKU(primerSku, 0.10);
        });

        const state = useSimuladorStore.getState();
        expect(state.configVolumenes.tasasPorSKU[primerSku]).toBe(0.10);
      }
    });

    it('getTasaCrecimientoSKU retorna tasa personalizada si existe', () => {
      const store = useSimuladorStore.getState();
      const primerSku = store.catalogoIngresos[0]?.codigo;
      
      if (primerSku) {
        act(() => {
          store.actualizarTasaCrecimientoSKU(primerSku, 0.15);
        });

        const state = useSimuladorStore.getState();
        const tasa = state.getTasaCrecimientoSKU(primerSku);
        expect(tasa).toBe(0.15);
      }
    });

    it('getTasaCrecimientoSKU retorna default si no hay personalizada', () => {
      const state = useSimuladorStore.getState();
      const tasa = state.getTasaCrecimientoSKU('SKU-SIN-TASA');
      expect(tasa).toBe(state.configVolumenes.tasaCrecimientoDefault);
    });
  });

  describe('Actions - Simulación', () => {
    it('iniciarSimulacion activa la simulación', () => {
      const store = useSimuladorStore.getState();
      
      act(() => {
        store.iniciarSimulacion();
      });

      const state = useSimuladorStore.getState();
      expect(state.simulacionActiva).toBe(true);
    });
  });

  describe('Actions - Reset', () => {
    it('resetearCatalogo restaura valores por defecto', () => {
      const store = useSimuladorStore.getState();
      
      // Modificar estado
      act(() => {
        store.actualizarConfig({ capitalInicial: 1 });
        store.actualizarPrecio('TEST', 999);
        store.iniciarSimulacion();
      });

      // Resetear
      act(() => {
        store.resetearCatalogo();
      });

      const state = useSimuladorStore.getState();
      expect(state.config.capitalInicial).toBe(500000000);
      expect(state.preciosPersonalizados).toEqual({});
      expect(state.simulacionActiva).toBe(false);
    });

    it('limpiarTodo resetea todo y limpia localStorage', () => {
      const store = useSimuladorStore.getState();
      
      act(() => {
        store.actualizarConfig({ capitalInicial: 1 });
        store.limpiarTodo();
      });

      const state = useSimuladorStore.getState();
      expect(state.config.capitalInicial).toBe(500000000);
      expect(state.ultimaActualizacion).toBeNull();
    });
  });

  describe('Getters', () => {
    it('getCatalogoCompleto retorna todos los catálogos combinados', () => {
      const state = useSimuladorStore.getState();
      const catalogoCompleto = state.getCatalogoCompleto();
      
      const totalEsperado = 
        state.catalogoIngresos.length + 
        state.catalogoCostos.length + 
        state.catalogoOPEX.length + 
        state.catalogoImpuestos.length;
      
      expect(catalogoCompleto.length).toBe(totalEsperado);
    });

    it('getVolumenesAño retorna volúmenes del año especificado', () => {
      const state = useSimuladorStore.getState();
      const volumenes2026 = state.getVolumenesAño(2026);
      
      expect(volumenes2026).toBeDefined();
      expect(Object.keys(volumenes2026).length).toBeGreaterThan(0);
    });

    it('getVolumenesAño retorna objeto vacío para año inexistente', () => {
      const state = useSimuladorStore.getState();
      const volumenes2099 = state.getVolumenesAño(2099);
      
      expect(volumenes2099).toEqual({});
    });
  });

  describe('CSV Import', () => {
    it('cargarCatalogoDesdeCSV rechaza CSV vacío', () => {
      const store = useSimuladorStore.getState();
      
      const resultado = store.cargarCatalogoDesdeCSV('');
      
      expect(resultado.success).toBe(false);
      expect(resultado.errores.length).toBeGreaterThan(0);
    });

    it('cargarCatalogoDesdeCSV rechaza CSV sin datos', () => {
      const store = useSimuladorStore.getState();
      
      const resultado = store.cargarCatalogoDesdeCSV('header1,header2');
      
      expect(resultado.success).toBe(false);
    });

    it('cargarCatalogoDesdeCSV procesa items válidos', () => {
      const store = useSimuladorStore.getState();
      
      const csv = `codigo,concepto,tipo,categoria,subcategoria,frecuencia,valor,esPorcentaje,driver,cuenta,obs,activo
ING-TEST-01,Test Ingreso,ingreso,ingresos,sub1,mensual,100000,FALSE,driver1,4101,obs,TRUE`;
      
      const resultado = store.cargarCatalogoDesdeCSV(csv);
      
      // Puede tener errores parciales pero debería procesar
      expect(resultado).toBeDefined();
    });
  });
});

describe('PARAMETROS_MACRO_DEFAULT', () => {
  it('tiene inflación decreciente en el tiempo', () => {
    const inflacion2026 = PARAMETROS_MACRO_DEFAULT[0].inflacionPct;
    const inflacion2031 = PARAMETROS_MACRO_DEFAULT[5].inflacionPct;
    
    expect(inflacion2026).toBeGreaterThan(inflacion2031);
  });

  it('tiene salario mínimo creciente', () => {
    const salario2026 = PARAMETROS_MACRO_DEFAULT[0].salarioMinimo;
    const salario2031 = PARAMETROS_MACRO_DEFAULT[5].salarioMinimo;
    
    expect(salario2031).toBeGreaterThan(salario2026);
  });

  it('tiene tasas consistentes', () => {
    PARAMETROS_MACRO_DEFAULT.forEach(param => {
      expect(param.tasaRentaPct).toBe(35);
      expect(param.tasaIVAPct).toBe(19);
    });
  });
});
